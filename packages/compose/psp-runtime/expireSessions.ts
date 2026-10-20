import type { InstrumentId } from '@river/psp-facts';
import { isSessionClosed } from '@river/psp-session';
import { appendFacts } from './appendFacts.ts';
import type { World } from './types/World.ts';

const hour = 3_600_000;
// How long an attempt may wait for pushed money, by instrument: a transfer or cash, three days; a direct
// debit, five banking days; a scanned code or a chain, a couple of hours.
const waitsFor: Partial<Record<InstrumentId, number>> = { bank_transfer: 72 * hour, voucher: 72 * hour, direct_debit: 120 * hour, qr_nbu: 2 * hour, stablecoin: 6 * hour };

/**
 * The clock closes what nobody ends: an attempt left before the money moved is abandoned when its time
 * passes; one waiting for pushed money expires after that instrument's own wait; a hold nobody captured
 * for seven days lapses and the money returns to the payer.
 */
export function expireSessions(world: World, at: string): number {
  const now = Date.parse(at);
  let closed = 0;
  for (const session of world.views.sessions.values()) {
    if (isSessionClosed(session) || session.outcome === 'review') continue;
    const clock = { via: 'world' as const, controller: 'clock', answering: null };
    if (session.outcome === 'awaiting_capture' && session.paymentId) {
      if (now - Date.parse(session.updatedAt) > 7 * 24 * hour) {
        appendFacts(world, session.sessionId, [
          { type: 'authorisation.Expired', payload: { sessionId: session.sessionId, paymentId: session.paymentId, orderId: session.orderId } },
          { type: 'session.Failed', payload: { sessionId: session.sessionId, invoiceId: session.invoiceId, code: 'authorisation_expired', reason: 'Nobody captured the hold in seven days' } },
        ], clock, at);
        closed += 1;
      }
      continue;
    }
    const wait = session.instrument ? waitsFor[session.instrument] : undefined;
    if (session.outcome === 'awaiting_funds' && wait !== undefined) {
      if (now - Date.parse(session.updatedAt) > wait) { appendFacts(world, session.sessionId, [{ type: 'session.Expired', payload: { sessionId: session.sessionId, invoiceId: session.invoiceId } }], clock, at); closed += 1; }
      continue;
    }
    if (session.paymentId === null && now > Date.parse(session.expiresAt)) {
      appendFacts(world, session.sessionId, [{ type: 'session.Abandoned', payload: { sessionId: session.sessionId, invoiceId: session.invoiceId } }], clock, at);
      closed += 1;
    }
  }
  return closed;
}
