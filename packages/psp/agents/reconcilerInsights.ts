import { moneyText } from './moneyText.ts';
import { nameOf } from './nameOf.ts';
import type { InsightDraft } from './types/Agent.ts';
import type { SwarmInput } from './types/SwarmInput.ts';
import { counted } from './counted.ts';

const day = 86_400_000;

/**
 * The Reconciler. Where the stand reconciles its banks' settlement batches, it reads the reconciled
 * batches: fees above the agreed terms, grouped by provider, become a claim to raise; a batch the bank
 * did not credit, a report that never came, a credit or an amount that differs become a break to
 * investigate. Elsewhere it watches captured payments whose shares should have been paid out by now, and
 * attempts where the money that arrived does not match.
 */
export function reconcilerInsights(input: SwarmInput): InsightDraft[] {
  if (input.reconciled !== undefined) return settlementInsights(input);
  const now = Date.parse(input.now);
  const out: InsightDraft[] = [];
  const late = input.payments.filter((p) => p.capturedAt && now - Date.parse(p.capturedAt) > 4 * day && now - Date.parse(p.capturedAt) < 30 * day
    && p.status === 'captured' && p.payouts.length === 0 && p.allocations.some((a) => a.role !== 'psp_fee' && (a.holdUntil === null || Date.parse(a.holdUntil) < now)));
  for (const p of late.slice(0, 6)) {
    out.push({
      agent: 'reconciler', unitId: p.unitId, subject: { kind: 'payment', id: p.paymentId },
      title: { 'en-GB': 'Captured, not paid out', uk: 'Списано, але не виплачено' },
      finding: { 'en-GB': `${moneyText(p.capturedMinor, p.currency)['en-GB']} captured on ${p.capturedAt!.slice(0, 10)} via ${p.acquirer}; no payout carried its shares, and none is held.`, uk: `${moneyText(p.capturedMinor, p.currency).uk} списано ${p.capturedAt!.slice(0, 10)} через ${p.acquirer}; жодна виплата не перенесла частки, утримання немає.` },
      evidence: [{ kind: 'payment', id: p.paymentId, note: { 'en-GB': `${counted(p.allocations.length, ['share', 'shares'], ['частка', 'частки', 'часток'])['en-GB']}, no payout`, uk: `${counted(p.allocations.length, ['share', 'shares'], ['частка', 'частки', 'часток']).uk}, виплат немає` } }],
      confidence: 0.81,
      proposal: { kind: 'investigate_break', risk: 'high', params: { paymentId: p.paymentId, acquirer: p.acquirer },
        effect: { 'en-GB': `Ask ${p.acquirer} for the settlement line of this payment and match it.`, uk: `Запитати в ${p.acquirer} рядок розрахунку за цим платежем і зіставити.` } },
      consulted: [],
    });
  }
  for (const s of input.sessions.filter((x) => x.mismatch && x.outcome === 'review')) {
    const got = moneyText(s.mismatch!.gotMinor, s.currency);
    const due = moneyText(s.mismatch!.expectedMinor, s.currency);
    out.push({
      agent: 'reconciler', unitId: s.unitId, subject: { kind: 'session', id: s.sessionId },
      title: { 'en-GB': 'Money arrived that the invoice does not explain', uk: 'Надійшли кошти, яких інвойс не пояснює' },
      finding: { 'en-GB': `The transfer for this attempt does not match: ${got['en-GB']} arrived, ${due['en-GB']} was due.`, uk: `Переказ за цією спробою не збігається: надійшло ${got.uk}, належало ${due.uk}.` },
      evidence: [{ kind: 'session', id: s.sessionId, note: { 'en-GB': 'held: the amount does not match', uk: 'затримано: сума не збігається' } }],
      confidence: 0.9,
      proposal: { kind: 'investigate_break', risk: 'high', params: { sessionId: s.sessionId },
        effect: { 'en-GB': 'Take what arrived — the invoice stays due for the rest — or return it all to the payer.', uk: 'Прийняти те, що надійшло, — решта лишиться до сплати за інвойсом, — або повернути все платнику.' } },
      consulted: [],
    });
  }
  return out;
}

/** Findings of the settlement reconciliation. */
function settlementInsights(input: SwarmInput): InsightDraft[] {
  const out: InsightDraft[] = [];
  const batches = input.reconciled ?? [];
  const where = (b: (typeof batches)[number]) => (b.storeId ? nameOf(input.units, b.storeId) : nameOf(input.units, b.merchantId));
  const fees = new Map<string, typeof batches[number][]>();
  for (const b of batches) if (b.status === 'fee_difference') fees.set(b.provider, [...(fees.get(b.provider) ?? []), b]);
  for (const [provider, list] of fees) {
    const over = list.reduce((s, b) => s + (b.differences.find((d) => d.kind === 'fee')?.deltaMinor ?? 0), 0);
    if (over <= 0) continue;
    const dates = list.map((b) => b.businessDate).sort();
    const name = list[0]!.providerName;
    out.push({
      agent: 'reconciler', unitId: input.units.find((u) => u.parentId === null)?.id ?? list[0]!.merchantId, subject: { kind: 'route', id: `${provider}:fees:${dates[0]}` }, series: `reconciler:fees:${provider}`,
      title: { 'en-GB': `${name['en-GB']}: fees above the agreed terms`, uk: `«${name.uk}»: комісії вище погоджених умов` },
      finding: {
        'en-GB': `${list.length} batches from ${dates[0]} to ${dates.at(-1)} were charged ${moneyText(over, list[0]!.currency)['en-GB']} more than the terms give for the cards in them. The breakdown shows debit cards priced as premium.`,
        uk: `У ${list.length} пакетах з ${dates[0]} по ${dates.at(-1)} утримано на ${moneyText(over, list[0]!.currency).uk} більше, ніж передбачають умови для карток у них. Розбивка показує дебетові картки за ціною преміальних.`,
      },
      evidence: list.slice(0, 6).map((b) => ({ kind: 'fact' as const, id: b.batchId, note: { 'en-GB': `${where(b)['en-GB']}, ${b.businessDate}: +${moneyText(b.differences.find((d) => d.kind === 'fee')?.deltaMinor ?? 0, b.currency)['en-GB']}`, uk: `${where(b).uk}, ${b.businessDate}: +${moneyText(b.differences.find((d) => d.kind === 'fee')?.deltaMinor ?? 0, b.currency).uk}` } })),
      confidence: 0.9,
      proposal: { kind: 'raise_claim', risk: 'high', params: { provider, batches: list.map((b) => b.batchId), amountMinor: over },
        effect: { 'en-GB': `Raise a claim with ${name['en-GB']} for ${moneyText(over, list[0]!.currency)['en-GB']}, with the batches and their breakdown attached.`, uk: `Подати претензію до «${name.uk}» на ${moneyText(over, list[0]!.currency).uk} з переліком пакетів і їхньою розбивкою.` } },
      consulted: [],
    });
  }
  const breaks: Record<string, { en: (b: (typeof batches)[number]) => string; uk: (b: (typeof batches)[number]) => string; title: [string, string] }> = {
    not_credited: { title: ['not credited', 'не зараховано'], en: (b) => `${b.providerName['en-GB']} reported ${moneyText(b.netMinor ?? 0, b.currency)['en-GB']} settled for ${b.businessDate}; the bank statement shows nothing two days after the value date.`, uk: (b) => `«${b.providerName.uk}» звітував про розрахунок ${moneyText(b.netMinor ?? 0, b.currency).uk} за ${b.businessDate}; виписка банку нічого не показує через два дні після дати валютування.` },
    not_reported: { title: ['no report', 'немає звіту'], en: (b) => `The tills recorded ${moneyText(b.grossMinor ?? 0, b.currency)['en-GB']} in card sales on ${b.businessDate}; ${b.providerName['en-GB']} has reported no batch for it.`, uk: (b) => `Каси зафіксували ${moneyText(b.grossMinor ?? 0, b.currency).uk} карткових продажів за ${b.businessDate}; «${b.providerName.uk}» не надіслав звіту про пакет.` },
    short_credit: { title: ['credit differs', 'зарахування відрізняється'], en: (b) => `The bank credited ${moneyText(b.differences.find((d) => d.kind === 'credit')?.actualMinor ?? 0, b.currency)['en-GB']} against a reported net of ${moneyText(b.differences.find((d) => d.kind === 'credit')?.expectedMinor ?? 0, b.currency)['en-GB']}.`, uk: (b) => `Банк зарахував ${moneyText(b.differences.find((d) => d.kind === 'credit')?.actualMinor ?? 0, b.currency).uk} при заявленому нетто ${moneyText(b.differences.find((d) => d.kind === 'credit')?.expectedMinor ?? 0, b.currency).uk}.` },
    gross_difference: {
      title: ['amount differs', 'сума відрізняється'],
      en: (b) => `${b.providerName['en-GB']} reported ${moneyText(b.differences.find((d) => d.kind === 'gross')?.actualMinor ?? 0, b.currency)['en-GB']}, the records show ${moneyText(b.differences.find((d) => d.kind === 'gross')?.expectedMinor ?? 0, b.currency)['en-GB']}${b.channel === 'in_store' ? ': a terminal’s batch may be missing from the report.' : b.channel === 'loyalty' ? ': a redemption may have been reversed in the bonus system and not refunded here.' : '.'}`,
      uk: (b) => `«${b.providerName.uk}» звітував про ${moneyText(b.differences.find((d) => d.kind === 'gross')?.actualMinor ?? 0, b.currency).uk}, облік показує ${moneyText(b.differences.find((d) => d.kind === 'gross')?.expectedMinor ?? 0, b.currency).uk}${b.channel === 'in_store' ? ': у звіті може бракувати пакета одного з терміналів.' : b.channel === 'loyalty' ? ': списання балів могли скасувати в бонусній системі без повернення тут.' : '.'}`,
    },
  };
  for (const b of batches) {
    const kind = breaks[b.status];
    if (!kind) continue;
    const place = where(b);
    out.push({
      agent: 'reconciler', unitId: b.storeId ?? b.merchantId, subject: { kind: 'route', id: b.batchId }, series: `reconciler:${b.batchId}`,
      title: { 'en-GB': `${place['en-GB']}, ${b.businessDate}: ${kind.title[0]}`, uk: `${place.uk}, ${b.businessDate}: ${kind.title[1]}` },
      finding: { 'en-GB': kind.en(b), uk: kind.uk(b) },
      evidence: [{ kind: 'fact', id: b.batchId, note: { 'en-GB': `${b.providerName['en-GB']} · ${b.channel}`, uk: `${b.providerName.uk} · ${b.channel}` } }],
      confidence: 0.88,
      proposal: { kind: 'investigate_break', risk: 'high', params: { batchId: b.batchId, provider: b.provider },
        effect: { 'en-GB': `Ask ${b.providerName['en-GB']} about the batch and record the answer with it.`, uk: `Запитати «${b.providerName.uk}» про пакет і записати відповідь до нього.` } },
      consulted: [],
    });
  }
  return out;
}
