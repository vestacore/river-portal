import { defineListener } from '@river/figure';
import { payFacts, type InvoiceIssued, type PaymentCaptured } from '@river/pay-facts';
import type { MouthState } from './types/MouthState.ts';

/** The mouth: arrival. It needs the invoice and a capture; it remembers which sessions were opened. */
export const mouth = defineListener<MouthState>({
  id: 'mouth',
  hears: [payFacts.invoiceIssued, payFacts.providerSessionOpened, payFacts.paymentCaptured, payFacts.orderCancelled],
  init: { invoice: null, sessions: [], capture: null, cancelled: false },
  step: (state, fact) => {
    switch (fact.type) {
      case payFacts.invoiceIssued: return { ...state, invoice: fact.payload as InvoiceIssued };
      case payFacts.providerSessionOpened: return { ...state, sessions: [...state.sessions, String(fact.payload.sessionRef)] };
      case payFacts.paymentCaptured: return state.capture ? state : { ...state, capture: fact.payload as PaymentCaptured };
      case payFacts.orderCancelled: return { ...state, cancelled: true };
      default: return state;
    }
  },
  ready: (state) => state.invoice !== null && state.capture !== null,
});
