import { payFacts, type ProviderName } from '@river/pay-facts';
import type { Fact } from '@river/stream';
import type { AttemptState } from './types/AttemptState.ts';

/**
 * Folds one fact into the attempts of an order. Every closure names what it closes, so a report
 * told twice, or told late about an older session, changes nothing. And nothing unasked can close
 * an attempt whose money is being asked for: while a capture intention is unanswered, only its own
 * answer ends the attempt — an expiry, or a failure the provider reports on its own, does not,
 * because the payer must not be sent to pay again while the first payment may still arrive.
 */
export function foldAttempt<S extends AttemptState>(state: S, fact: Fact): S {
  const { payload } = fact;
  const { open } = state;
  const mine = open !== null && open.sessionRef !== null && payload.sessionRef === open.sessionRef;
  const close = (): S => (open ? { ...state, open: null, failed: [...state.failed, open.provider] } : state);
  switch (fact.type) {
    case payFacts.providerRouted: return { ...state, attempt: Number(payload.attempt), open: { provider: payload.provider as ProviderName, sessionRef: null, capture: 'none' } };
    case payFacts.checkoutRefused: return { ...state, attempt: Number(payload.attempt), open: null };
    case payFacts.providerSessionOpened: return open && payload.attempt === state.attempt ? { ...state, open: { ...open, sessionRef: String(payload.sessionRef) } } : state;
    case payFacts.providerSessionFailed: return open && payload.attempt === state.attempt ? close() : state;
    case payFacts.providerSessionExpired: return mine && open.capture === 'none' ? close() : state;
    case payFacts.providerCaptureRequested: return mine ? { ...state, open: { ...open, capture: 'asked' } } : state;
    case payFacts.paymentPending: return mine ? { ...state, open: { ...open, capture: 'pending' } } : state;
    case payFacts.paymentFailed: {
      const answers = fact.origin.via === 'world' && fact.origin.answering !== null;
      return mine && (open.capture !== 'asked' || answers) ? close() : state;
    }
    default: return state;
  }
}
