import type { FetchLike } from './FetchLike.ts';

/**
 * What the Stripe controller needs. The secret key comes from the environment of the function that
 * mounts it and is never written to a stream. `accountFor` gives a merchant's connected account, so
 * Stripe itself splits the payment: the net to the merchant, the fee to the platform.
 * `sessionTtlMinutes` is how long a hosted page stays open (Stripe allows 30 minutes to 24 hours).
 */
export type StripeOptions = {
  secretKey: string;
  returnUrl: (orderId: string) => string;
  accountFor: (merchantId: string) => string | null;
  sessionTtlMinutes: number;
  apiBase?: string;
  fetch?: FetchLike;
};
