import { appendFacts } from './appendFacts.ts';
import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/** An operator releases a hold instead of taking it: the attempt ends without money, the invoice stays payable. */
export function voidHold(world: World, actor: Actor, paymentId: string, reason: string, at: string): CommandResult {
  const payment = world.views.payments.get(paymentId);
  if (!payment) return { ok: false, error: 'not_found' };
  const denied = guard(world, actor, 'payments.capture', payment.unitId, at);
  if (denied) return { ok: false, error: denied };
  if (payment.status !== 'authorised') return { ok: false, error: 'nothing_to_release' };
  const by = actor.kind === 'person' ? actor.personId : 'operator';
  appendFacts(world, payment.sessionId, [
    { type: 'capture.Voided', payload: { sessionId: payment.sessionId, paymentId, orderId: payment.orderId, by, reason } },
    { type: 'session.Failed', payload: { sessionId: payment.sessionId, invoiceId: payment.invoiceId, code: 'voided', reason } },
  ], { via: 'door', actor: by, role: 'operator' }, at);
  if (actor.kind === 'person') recordAudit(world, { personId: actor.personId, role: actor.role, unitId: payment.unitId, action: 'payment.void', target: paymentId, detail: { 'en-GB': `Released the hold: ${reason}`, uk: `Зняв блокування: ${reason}` }, at });
  return { ok: true, value: { paymentId } };
}
