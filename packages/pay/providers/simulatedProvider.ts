import type { Controller } from '@river/figure';
import { payFacts, type PaymentCaptured, type ProviderCaptureRequested, type ProviderName, type ProviderSessionFailed, type ProviderSessionOpened, type ProviderSessionRequested } from '@river/pay-facts';

/**
 * A deterministic stand-in for a provider, mounted under the provider's own name so that the river
 * routes and records exactly as it would with the real one. It is the machine, not a bank, and says
 * so: every fact it answers with carries `simulated: true`. No money moves.
 */
export function simulatedProvider(name: ProviderName, sessionUrl: (sessionRef: string) => string): Controller {
  return {
    id: name,
    claims: [payFacts.providerSessionRequested, payFacts.providerCaptureRequested],
    accepts: (intention) => intention.payload.provider === name,
    discharge: async (intention, key) => {
      if (intention.type === payFacts.providerSessionRequested) {
        const request = intention.payload as ProviderSessionRequested;
        const sessionRef = `sim_${name}_${key}`;
        const opened: ProviderSessionOpened = { provider: name, attempt: request.attempt, sessionRef, redirectUrl: sessionUrl(sessionRef), simulated: true };
        return [{ type: payFacts.providerSessionOpened, payload: opened }];
      }
      const request = intention.payload as ProviderCaptureRequested;
      const captured: PaymentCaptured = { provider: name, sessionRef: request.sessionRef, providerRef: `simcap_${key}`, amountMinor: request.amountMinor, currency: request.currency, simulated: true };
      return [{ type: payFacts.paymentCaptured, payload: captured }];
    },
    // As with the provider it stands for: an unopened page is a failure, an unanswered capture is never called one.
    exhausted: (intention, reason) => {
      if (intention.type === payFacts.providerCaptureRequested) return null;
      const failed: ProviderSessionFailed = { provider: name, attempt: Number(intention.payload.attempt ?? 0), reason };
      return [{ type: payFacts.providerSessionFailed, payload: failed }];
    },
  };
}
