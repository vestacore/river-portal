import type { Currency } from './Currency.ts';
import type { ProviderName } from './ProviderName.ts';

/**
 * `order.Placed` — the door, by a merchant: a request for something, with its shape. `providers` are
 * the merchant's connected providers at that moment; `payKeyHash` is the hash of the key the payer
 * will pay with (the key itself is shown once and never stored). `payerRef` is a handle, not a name.
 */
export type OrderPlaced = {
  orderId: string;
  merchantId: string;
  payerRef: string;
  title: string;
  amountMinor: number;
  currency: Currency;
  payKeyHash: string;
  providers: ProviderName[];
};
