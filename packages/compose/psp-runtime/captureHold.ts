import { appendFacts } from './appendFacts.ts';
import { driveSession } from './driveSession.ts';
import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/** An operator takes the funds a payment holds (manual capture, at shipment): the door asks, the acquirer answers, the split follows. */
export function captureHold(world: World, actor: Actor, paymentId: string, at: string): CommandResult {
  const payment = world.views.payments.get(paymentId);
  if (!payment) return { ok: false, error: 'not_found' };
  const denied = guard(world, actor, 'payments.capture', payment.unitId, at);
  if (denied) return { ok: false, error: denied };
  if (payment.status !== 'authorised') return { ok: false, error: 'nothing_to_capture' };
  const by = actor.kind === 'person' ? actor.personId : 'payer';
  appendFacts(world, payment.sessionId, [{ type: 'capture.Requested', payload: { sessionId: payment.sessionId, paymentId, amountMinor: payment.amountMinor, by } }], { via: 'door', actor: by, role: 'operator' }, at);
  const scenario = world.scenarios.get(payment.sessionId) ?? { challenge: false, issuer: 'approve' as const };
  world.scenarios.set(payment.sessionId, { ...scenario, captureRequested: true });
  driveSession(world, payment.sessionId, at);
  if (actor.kind === 'person') recordAudit(world, { personId: actor.personId, role: actor.role, unitId: payment.unitId, action: 'payment.capture', target: paymentId, detail: { 'en-GB': 'Captured the held funds', uk: 'Списав заблоковані кошти' }, at });
  return { ok: true, value: { paymentId } };
}
