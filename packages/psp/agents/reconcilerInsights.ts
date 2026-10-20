import { moneyText } from './moneyText.ts';
import type { InsightDraft } from './types/Agent.ts';
import type { SwarmInput } from './types/SwarmInput.ts';
import { counted } from './counted.ts';

const day = 86_400_000;

/**
 * The Reconciler: captured payments whose shares should have been paid out by now but were not (a
 * break between the ledger and the bank), and attempts where the money that arrived does not match.
 */
export function reconcilerInsights(input: SwarmInput): InsightDraft[] {
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
