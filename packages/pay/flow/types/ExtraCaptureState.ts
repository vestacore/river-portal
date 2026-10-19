import type { PaymentCaptured } from '@river/pay-facts';

/** The first capture's reference, and the latest capture that is not that one. */
export type ExtraCaptureState = {
  first: string | null;
  extra: PaymentCaptured | null;
};
