import { defineListener } from '@river/figure';
import { payFacts, type InvoiceIssued } from '@river/pay-facts';
import { attemptFacts } from './data/attemptFacts.ts';
import { foldAttempt } from './foldAttempt.ts';
import type { GateState } from './types/GateState.ts';

/**
 * The gate to the mouth. It needs an invoice and the payer's word — and no attempt under way, no
 * payment already made, no cancellation and no flag. Every state it holds is read from facts.
 */
export const checkoutGate = defineListener<GateState>({
  id: 'checkoutGate',
  hears: [payFacts.invoiceIssued, payFacts.checkoutRequested, ...attemptFacts, payFacts.paymentMismatched, payFacts.orderPaid, payFacts.orderCancelled],
  init: { invoice: null, asked: false, attempt: 0, open: null, failed: [], paid: false, cancelled: false, flagged: false },
  step: (state, fact) => {
    switch (fact.type) {
      case payFacts.invoiceIssued: return { ...state, invoice: fact.payload as InvoiceIssued };
      case payFacts.checkoutRequested: return state.open ? state : { ...state, asked: true };
      case payFacts.providerRouted:
      case payFacts.checkoutRefused: return { ...foldAttempt(state, fact), asked: false };
      case payFacts.paymentMismatched: return { ...state, flagged: true };
      case payFacts.orderPaid: return { ...state, paid: true };
      case payFacts.orderCancelled: return { ...state, cancelled: true };
      default: return foldAttempt(state, fact);
    }
  },
  ready: (state) => state.invoice !== null && state.asked && state.open === null && !state.paid && !state.cancelled && !state.flagged,
});
