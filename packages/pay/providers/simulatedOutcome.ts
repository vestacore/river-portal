import { payFacts, type Currency, type PaymentCaptured, type PaymentFailed, type ProviderName, type ProviderSessionApproved } from '@river/pay-facts';
import type { FactDraft } from '@river/stream';
import type { SimulatedOutcome } from './types/SimulatedOutcome.ts';

/**
 * What the simulated provider's page reports back — its "webhook". A card-style provider captures at
 * once; a wallet-style provider reports the payer's approval and waits to be asked to capture, as
 * PayPal does. A decline ends the attempt.
 */
export function simulatedOutcome(session: { provider: ProviderName; sessionRef: string }, invoice: { amountMinor: number; currency: Currency }, outcome: SimulatedOutcome): FactDraft[] {
  if (outcome === 'declined') {
    const failed: PaymentFailed = { provider: session.provider, sessionRef: session.sessionRef, reason: 'declined on the simulated page' };
    return [{ type: payFacts.paymentFailed, payload: failed }];
  }
  if (session.provider === 'paypal') {
    const approved: ProviderSessionApproved = { provider: session.provider, sessionRef: session.sessionRef };
    return [{ type: payFacts.providerSessionApproved, payload: approved }];
  }
  const captured: PaymentCaptured = { provider: session.provider, sessionRef: session.sessionRef, providerRef: `simpay_${session.sessionRef}`, amountMinor: invoice.amountMinor, currency: invoice.currency, simulated: true };
  return [{ type: payFacts.paymentCaptured, payload: captured }];
}
