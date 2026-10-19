import { defineJoiner } from '@river/figure';
import { payFacts, type PaymentMismatched } from '@river/pay-facts';
import type { ExtraCaptureState } from './types/ExtraCaptureState.ts';
import type { MouthState } from './types/MouthState.ts';

/**
 * A second payment for one order is flagged, once for each: nothing more is posted, and an operator
 * returns it. The order keeps what it settled with the first.
 */
export const flagExtraCapture = defineJoiner<{ mouth: MouthState; again: ExtraCaptureState }>({
  id: 'flagExtraCapture',
  demands: { mouth: 'mouth', again: 'extraCapture' },
  round: ({ again }) => again.extra?.providerRef ?? 'none',
  emit: ({ mouth: { invoice }, again: { extra } }) => {
    if (!invoice || !extra) return [];
    const mismatch: PaymentMismatched = { reason: 'duplicate', providerRef: extra.providerRef, expectedMinor: invoice.amountMinor, expectedCurrency: invoice.currency, gotMinor: extra.amountMinor, gotCurrency: extra.currency };
    return [{ type: payFacts.paymentMismatched, payload: mismatch }];
  },
});
