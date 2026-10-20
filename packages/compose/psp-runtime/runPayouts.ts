import { payoutsDue } from '@river/psp-payment';
import { policyValue } from '@river/psp-units';
import { appendFacts } from './appendFacts.ts';
import { effectiveFor } from './effectiveFor.ts';
import type { World } from './types/World.ts';

const lag: Record<string, number> = { 'T+0': 0, 'T+1': 1, 'T+2': 2, weekly: 7 };

/**
 * The payout run: every share whose hold has passed and that no payout carried yet leaves for its
 * recipient, batched by recipient and day, once the unit's schedule allows (T+1, T+2, weekly). Payouts a
 * person put on hold wait — and so, in the demo's story, do a few the acquirer's settlement file missed.
 */
export function runPayouts(world: World, at: string, only?: ReadonlySet<string>): number {
  let sent = 0;
  const day = at.slice(0, 10).replace(/-/g, '');
  for (const payment of world.views.payments.values()) {
    if (only && !only.has(payment.paymentId)) continue;
    if (world.heldPayouts.includes(payment.paymentId) || world.lostSettlement.includes(payment.paymentId) || !payment.capturedAt) continue;
    const schedule = String(policyValue(effectiveFor(world, payment.unitId), 'settlement.schedule') ?? 'T+1');
    const ready = new Date(Date.parse(payment.capturedAt.slice(0, 10)) + (lag[schedule] ?? 1) * 86_400_000).toISOString();
    if (ready > at) continue;
    const due = payoutsDue(payment, at);
    if (due.length === 0) continue;
    appendFacts(world, payment.paymentId, due.map((a) => ({ type: 'payout.Sent' as const, payload: {
      paymentId: payment.paymentId, batchId: `po_${a.recipientUnitId.replace(/^ou-/, '')}_${day}${a.role === 'reserve' ? '_r' : ''}`, acquirer: payment.acquirer, rule: a.rule,
      recipientUnitId: a.recipientUnitId, amountMinor: a.amountMinor, currency: a.currency,
    } })), { via: 'world', controller: `${payment.acquirer}:settlement`, answering: null }, at);
    sent += due.length;
  }
  return sent;
}
