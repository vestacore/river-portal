import { payFacts, type CheckoutRequested } from '@river/pay-facts';
import type { FactDraft } from '@river/stream';

/** The payer's word at the gate: "let me pay this invoice". Holding the pay key is the authority to say it. */
export function requestCheckout(invoiceId: string): FactDraft {
  const requested: CheckoutRequested = { invoiceId };
  return { type: payFacts.checkoutRequested, payload: requested };
}
