import type { Currency } from './Currency.ts';
import type { ProviderName } from './ProviderName.ts';

/** `providerSession.Requested` — an intention: ask the provider for a hosted checkout session. */
export type ProviderSessionRequested = {
  provider: ProviderName;
  attempt: number;
  orderId: string;
  invoiceId: string;
  merchantId: string;
  title: string;
  amountMinor: number;
  currency: Currency;
  feeMinor: number;
};
