import type { FetchLike } from './FetchLike.ts';

/** What the PayPal controller needs. `payeeFor` gives a merchant's PayPal merchant id for the split. */
export type PaypalOptions = {
  clientId: string;
  secret: string;
  apiBase: string;
  returnUrl: (orderId: string) => string;
  payeeFor: (merchantId: string) => string | null;
  fetch?: FetchLike;
};
