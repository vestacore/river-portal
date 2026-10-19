import type { Currency } from './Currency.ts';
import type { ProviderName } from './ProviderName.ts';

/** `order.Paid` — a figure: the river reached the mouth; the merchant is owed `netMinor`. */
export type OrderPaid = {
  provider: ProviderName;
  providerRef: string;
  amountMinor: number;
  feeMinor: number;
  netMinor: number;
  currency: Currency;
};
