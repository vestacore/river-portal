import { payFacts } from '@river/pay-facts';

/** The facts a figure writes for the bank to carry out. */
export const intentionTypes: readonly string[] = [payFacts.providerSessionRequested, payFacts.providerCaptureRequested];
