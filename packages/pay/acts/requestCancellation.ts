import { payFacts, type CancellationRequested } from '@river/pay-facts';
import type { FactDraft } from '@river/stream';

/**
 * "Withdraw this order" — said by a merchant or an operator at the door, or by the clock for an
 * invoice past its date. It is only asked here; the figure decides. `unless` names what may stand
 * in the way: a payment being collected, or — for the clock — any attempt under way.
 */
export function requestCancellation(reason: string, unless: CancellationRequested['unless'] = 'collecting'): FactDraft {
  const requested: CancellationRequested = { reason: reason.trim().slice(0, 200) || 'withdrawn', unless };
  return { type: payFacts.cancellationRequested, payload: requested };
}
