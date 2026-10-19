/**
 * `payment.Mismatched` — a guard: money arrived that the invoice does not explain. Nothing is settled
 * by it; an operator decides. `reason` says which check failed — `duplicate` is a second capture
 * for an order that already has one.
 */
export type PaymentMismatched = {
  reason: 'amount' | 'currency' | 'session' | 'cancelled' | 'duplicate';
  providerRef: string;
  expectedMinor: number;
  expectedCurrency: string;
  gotMinor: number;
  gotCurrency: string;
};
