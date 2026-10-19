import { payFacts } from '@river/pay-facts';

/** The facts that move an attempt: every listener that follows attempts hears these. */
export const attemptFacts: readonly string[] = [
  payFacts.providerRouted, payFacts.checkoutRefused, payFacts.providerSessionOpened, payFacts.providerSessionFailed, payFacts.providerSessionExpired,
  payFacts.providerCaptureRequested, payFacts.paymentPending, payFacts.paymentFailed,
];
