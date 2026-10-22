import { payoutsDue } from '@river/psp-payment';
import { moneyText } from './moneyText.ts';
import { nameOf } from './nameOf.ts';
import type { InsightDraft } from './types/Agent.ts';
import type { SwarmInput } from './types/SwarmInput.ts';
import { counted } from './counted.ts';

const day = 86_400_000;

/**
 * The Sentinel: card testing (one payer, many failed attempts with several cards in a day) and sudden
 * amounts (a payment far above its merchant's usual, while its shares are not yet paid out). Each finding
 * proposes an alert or a hold; a person decides.
 */
export function sentinelInsights(input: SwarmInput): InsightDraft[] {
  const out: InsightDraft[] = [];
  const now = Date.parse(input.now);
  const orderOf = new Map(input.orders.map((o) => [o.orderId, o]));
  const recent = input.sessions.filter((s) => now - Date.parse(s.openedAt) < day);
  const byPayer = new Map<string, typeof recent>();
  for (const s of recent) {
    const payer = orderOf.get(s.orderId)?.payerRef;
    if (payer) byPayer.set(payer, [...(byPayer.get(payer) ?? []), s]);
  }
  for (const [payer, sessions] of byPayer) {
    const failed = sessions.filter((s) => s.outcome === 'failed');
    const cards = new Set(sessions.map((s) => s.detail?.last4).filter(Boolean));
    if (failed.length < 4 || cards.size < 3) continue;
    const unitId = sessions[0]!.unitId;
    const name = nameOf(input.units, sessions[0]!.merchantId);
    out.push({
      agent: 'sentinel', unitId, subject: { kind: 'session', id: failed[0]!.sessionId },
      title: { 'en-GB': `Card testing by payer ${payer}`, uk: `Перебір карток платником ${payer}` },
      finding: { 'en-GB': `${failed.length} failed attempts with ${cards.size} different cards in 24 hours at ${name['en-GB']}.`, uk: `${counted(failed.length, ['failed attempt', 'failed attempts'], ['невдала спроба', 'невдалі спроби', 'невдалих спроб']).uk} з ${cards.size} різними картками за добу в ${name.uk}.` },
      evidence: failed.slice(0, 6).map((s) => ({ kind: 'session' as const, id: s.sessionId, note: { 'en-GB': `${s.failure?.code ?? 'failed'} · •••• ${s.detail?.last4 ?? '—'}`, uk: `${s.failure?.code ?? 'невдало'} · •••• ${s.detail?.last4 ?? '—'}` } })),
      confidence: Math.min(0.95, 0.55 + failed.length * 0.06),
      proposal: { kind: 'open_alert', risk: 'high', params: { payerRef: payer, sessions: failed.map((s) => s.sessionId) },
        effect: { 'en-GB': 'Open a velocity alert and hold this payer’s next attempts for review.', uk: 'Відкрити сповіщення про частоту і затримувати наступні спроби платника на перевірку.' } },
      consulted: [],
    });
  }
  const byMerchant = new Map<string, number[]>();
  for (const p of input.payments) if (p.capturedMinor > 0) byMerchant.set(p.merchantId, [...(byMerchant.get(p.merchantId) ?? []), p.amountMinor]);
  const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] ?? 0; };
  for (const p of input.payments) {
    if (now - Date.parse(p.createdAt) > 7 * day || p.capturedMinor === 0) continue;
    const usual = median(byMerchant.get(p.merchantId) ?? []);
    if (usual === 0 || p.amountMinor < usual * 8) continue;
    // A hold only means something while a share is still to be paid out.
    if (input.settlement !== 'direct' && payoutsDue(p, '9999-12-31T00:00:00.000Z').length === 0) continue;
    if (input.settlement === 'direct' && now - Date.parse(p.createdAt) > 2 * day) continue;
    out.push({
      agent: 'sentinel', unitId: p.unitId, subject: { kind: 'payment', id: p.paymentId },
      title: { 'en-GB': 'An amount far above the usual', uk: 'Сума значно вища за звичну' },
      finding: { 'en-GB': `${moneyText(p.amountMinor, p.currency)['en-GB']} is ${Math.round(p.amountMinor / usual)}× the merchant’s median payment (${moneyText(usual, p.currency)['en-GB']}).`, uk: `${moneyText(p.amountMinor, p.currency).uk} — у ${Math.round(p.amountMinor / usual)} раз більше за медіанний платіж мерчанта (${moneyText(usual, p.currency).uk}).` },
      evidence: [{ kind: 'payment', id: p.paymentId, note: { 'en-GB': `${p.instrument} · ${p.acquirer}`, uk: `${p.instrument} · ${p.acquirer}` } }],
      confidence: 0.58,
      // Where acquirers settle to the merchant directly there is no payout of the platform's to hold: an alert, then.
      proposal: input.settlement === 'direct'
        ? { kind: 'open_alert', risk: 'high', params: { paymentId: p.paymentId, sessions: [p.sessionId] },
          effect: { 'en-GB': 'Open an alert to check the customer and the order before it ships.', uk: 'Відкрити сповіщення, щоб перевірити клієнта й замовлення до відвантаження.' } }
        : { kind: 'hold_payouts', risk: 'high', params: { paymentId: p.paymentId },
          effect: { 'en-GB': 'Hold the payouts of this payment until a compliance officer has looked.', uk: 'Утримати виплати за цим платежем, доки офіцер не перевірить.' } },
      consulted: [],
    });
  }
  return out;
}
