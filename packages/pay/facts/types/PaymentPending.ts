import type { ProviderName } from './ProviderName.ts';

/**
 * `payment.Pending` — the world: the provider accepted the capture but has not completed it yet.
 * No money is counted and the attempt stays open; the provider will report the outcome itself.
 */
export type PaymentPending = {
  provider: ProviderName;
  sessionRef: string;
  providerRef: string;
  reason: string;
};
