import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import { requestCapture } from './requestCapture.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/**
 * An operator — or the merchant's order system, through its key — takes the funds a payment holds: all of
 * them at shipment, or the picked total after picking, when the rest of the hold is released. Never more
 * than was authorised. The door asks, the acquirer answers, the split follows.
 */
export function captureHold(world: World, actor: Actor, paymentId: string, at: string, amountMinor?: number): CommandResult {
  const payment = world.views.payments.get(paymentId);
  if (!payment) return { ok: false, error: 'not_found' };
  const denied = guard(world, actor, 'payments.capture', payment.unitId, at);
  if (denied) return { ok: false, error: denied };
  if (payment.status !== 'authorised') return { ok: false, error: 'nothing_to_capture' };
  const amount = amountMinor === undefined ? payment.amountMinor : amountMinor;
  if (!Number.isInteger(amount) || amount <= 0) return { ok: false, error: 'a positive amount' };
  if (amount > payment.amountMinor) return { ok: false, error: 'more than was authorised' };
  const by = actor.kind === 'person' ? actor.personId : 'payer';
  requestCapture(world, paymentId, amount, by, { via: 'door', actor: by, role: actor.kind === 'person' ? actor.role : 'operator' }, at);
  if (actor.kind === 'person') recordAudit(world, { personId: actor.personId, role: actor.role, unitId: payment.unitId, action: 'payment.capture', target: paymentId, detail: amount < payment.amountMinor ? { 'en-GB': 'Captured part of the hold; the rest released', uk: 'Списав частину блокування; решту розблоковано' } : { 'en-GB': 'Captured the held funds', uk: 'Списав заблоковані кошти' }, at });
  return { ok: true, value: { paymentId } };
}
