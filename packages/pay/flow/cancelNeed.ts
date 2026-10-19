import { defineListener } from '@river/figure';
import { payFacts } from '@river/pay-facts';
import { attemptFacts } from './data/attemptFacts.ts';
import { foldAttempt } from './foldAttempt.ts';
import type { CancelState } from './types/CancelState.ts';

/**
 * The point where a cancellation is asked for. It needs a request not yet decided; it follows the
 * attempts with the same fold as the gate, so the decision is taken on exactly what the gate sees.
 */
export const cancelNeed = defineListener<CancelState>({
  id: 'cancelNeed',
  hears: [payFacts.cancellationRequested, payFacts.cancellationRefused, payFacts.orderCancelled, payFacts.orderPaid, payFacts.paymentMismatched, ...attemptFacts],
  init: { asked: 0, decided: 0, last: null, paid: false, flagged: false, cancelled: false, attempt: 0, open: null, failed: [] },
  step: (state, fact) => {
    switch (fact.type) {
      case payFacts.cancellationRequested: {
        const by = fact.origin.via === 'door' ? fact.origin.role : fact.origin.via === 'world' ? fact.origin.controller : fact.origin.by;
        return { ...state, asked: state.asked + 1, last: { reason: String(fact.payload.reason), unless: fact.payload.unless === 'underWay' ? 'underWay' : 'collecting', by } };
      }
      case payFacts.cancellationRefused: return { ...state, decided: state.asked };
      case payFacts.orderCancelled: return { ...state, decided: state.asked, cancelled: true };
      case payFacts.orderPaid: return { ...state, paid: true };
      case payFacts.paymentMismatched: return { ...state, flagged: true };
      default: return foldAttempt(state, fact);
    }
  },
  ready: (state) => state.asked > state.decided,
});
