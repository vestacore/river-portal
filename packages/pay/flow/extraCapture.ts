import { defineListener } from '@river/figure';
import { payFacts, type PaymentCaptured } from '@river/pay-facts';
import type { ExtraCaptureState } from './types/ExtraCaptureState.ts';

/**
 * Watches for money arriving twice. The first capture belongs to the mouth; the same capture
 * reported again — by an answer and by a webhook — is the same money. A capture with another
 * reference is a second payment for one order.
 */
export const extraCapture = defineListener<ExtraCaptureState>({
  id: 'extraCapture',
  hears: [payFacts.paymentCaptured],
  init: { first: null, extra: null },
  step: (state, fact) => {
    const capture = fact.payload as PaymentCaptured;
    if (state.first === null) return { ...state, first: capture.providerRef };
    return capture.providerRef === state.first ? state : { ...state, extra: capture };
  },
  ready: (state) => state.extra !== null,
});
