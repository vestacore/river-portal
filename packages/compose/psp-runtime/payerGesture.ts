import { isSessionClosed } from '@river/psp-session';
import { driveSession } from './driveSession.ts';
import type { PayerGesture, Waiting, World } from './types/World.ts';

/**
 * What the payer (or, in the demo, the stand-in world the payer clicks) says in the middle of an attempt:
 * answers the issuer's challenge, confirms on the device, approves in the bank or with the lender, pays the
 * transfer, scans the code, pays cash, signs a mandate. The answer is given to the scenario; the drive writes it.
 */
export function payerGesture(world: World, sessionId: string, gesture: PayerGesture, at: string): Waiting | { error: string } {
  const session = world.views.sessions.get(sessionId);
  if (!session || isSessionClosed(session)) return { error: 'closed' };
  const scenario = world.scenarios.get(sessionId);
  if (!scenario) return { error: 'no_instrument' };
  switch (gesture.kind) {
    case 'challenge': scenario.challengePass = gesture.pass; break;
    case 'device': scenario.device = true; break;
    case 'consent': scenario.consent = gesture.approve; if (session.instrument === 'pay_by_bank') scenario.pushed = gesture.approve; break;
    case 'funds': scenario.pushed = true; break;
    case 'mandate': if (!/^[A-Z]{2}\d{2}[A-Z0-9]{8,30}$/.test(gesture.iban.replace(/\s/g, ''))) return { error: 'iban_invalid' }; scenario.mandateRef = `MD-${session.sessionId.slice(3, 9)}`; break;
  }
  return driveSession(world, sessionId, at);
}
