import type { Currency, ProviderName } from '@river/pay-facts';

/** What a capture's double entry is made from. */
export type CaptureInput = {
  merchantId: string;
  provider: ProviderName;
  amountMinor: number;
  feeMinor: number;
  currency: Currency;
};
