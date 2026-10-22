import type { Origin } from '@river/stream';
import { appendFacts } from './appendFacts.ts';
import { driveSession } from './driveSession.ts';
import type { World } from './types/World.ts';

/**
 * Asks the acquirer to capture a hold — all of it, or the amount given (the rest is released). The door
 * of `captureHold` checks who asks; the merchant's order system asks through this directly, by its key.
 */
export function requestCapture(world: World, paymentId: string, amountMinor: number, by: string, origin: Origin, at: string): boolean {
  const payment = world.views.payments.get(paymentId);
  if (!payment || payment.status !== 'authorised' || amountMinor <= 0 || amountMinor > payment.amountMinor) return false;
  appendFacts(world, payment.sessionId, [{ type: 'capture.Requested', payload: { sessionId: payment.sessionId, paymentId, amountMinor, by } }], origin, at);
  const scenario = world.scenarios.get(payment.sessionId) ?? { challenge: false, issuer: 'approve' as const };
  world.scenarios.set(payment.sessionId, { ...scenario, captureRequested: true, captureAmountMinor: amountMinor });
  driveSession(world, payment.sessionId, at);
  return true;
}
