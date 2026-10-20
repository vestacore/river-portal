import { disputeReasonLabels } from '@river/psp-payment';
import { counted } from './counted.ts';
import type { InsightDraft } from './types/Agent.ts';
import type { SwarmInput } from './types/SwarmInput.ts';

const day = 86_400_000;
const reasonOf = (reason: string) => disputeReasonLabels[reason as keyof typeof disputeReasonLabels] ?? { 'en-GB': reason, uk: reason };

/**
 * The Dispute clerk: open disputes due within a week, with the evidence the river already holds — the
 * receipt, the 3-D Secure result of the attempt, the delivery of the order.
 */
export function clerkInsights(input: SwarmInput): InsightDraft[] {
  const now = Date.parse(input.now);
  const out: InsightDraft[] = [];
  for (const p of input.payments) {
    for (const d of p.disputes.filter((x) => x.status === 'open' && Date.parse(x.respondBy) - now < 7 * day)) {
      const session = input.sessions.find((s) => s.sessionId === p.sessionId);
      const order = input.orders.find((o) => o.orderId === p.orderId);
      const evidence: InsightDraft['evidence'] = [{ kind: 'payment', id: p.paymentId, note: { 'en-GB': `receipt ${session?.receiptId ?? '—'}`, uk: `квитанція ${session?.receiptId ?? '—'}` } }];
      if (session?.consent === 'authentication.Passed') evidence.push({ kind: 'session', id: session.sessionId, note: { 'en-GB': '3-D Secure passed: liability shifts to the issuer', uk: '3-D Secure пройдено: відповідальність переходить до емітента' } });
      if (order?.fulfilment === 'delivered') evidence.push({ kind: 'order', id: order.orderId, note: { 'en-GB': `delivered, ${order.tracking?.carrier ?? ''} ${order.tracking?.ref ?? ''}`, uk: `доставлено, ${order.tracking?.carrier ?? ''} ${order.tracking?.ref ?? ''}` } });
      const days = Math.max(0, Math.ceil((Date.parse(d.respondBy) - now) / day));
      out.push({
        agent: 'clerk', unitId: p.unitId, subject: { kind: 'payment', id: p.paymentId },
        title: { 'en-GB': `Dispute ${d.disputeId}: ${counted(days, ['day', 'days'], ['день', 'дні', 'днів'])['en-GB']} to respond`, uk: `Спір ${d.disputeId}: ${counted(days, ['day', 'days'], ['день', 'дні', 'днів']).uk} на відповідь` },
        finding: { 'en-GB': `Reason: ${reasonOf(d.reason)['en-GB']}. ${counted(evidence.length, ['piece', 'pieces'], ['доказ', 'докази', 'доказів'])['en-GB']} of evidence found in the river.`, uk: `Причина: ${reasonOf(d.reason).uk}. У потоці знайдено ${counted(evidence.length, ['piece', 'pieces'], ['доказ', 'докази', 'доказів']).uk}.` },
        evidence,
        confidence: evidence.length >= 3 ? 0.78 : 0.52,
        proposal: { kind: 'prepare_evidence', risk: 'high', params: { paymentId: p.paymentId, disputeId: d.disputeId },
          effect: { 'en-GB': 'Assemble the evidence pack and submit it to the scheme.', uk: 'Зібрати пакет доказів і подати його платіжній системі.' } },
        consulted: [],
      });
    }
  }
  return out;
}
