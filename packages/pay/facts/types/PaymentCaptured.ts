import type { ProviderName } from './ProviderName.ts';

/**
 * `payment.Captured` — the world: the provider says the money moved. `currency` is what the provider
 * reported, as it reported it; the mouth compares it with the invoice before anything is settled.
 */
export type PaymentCaptured = {
  provider: ProviderName;
  sessionRef: string;
  providerRef: string;
  amountMinor: number;
  currency: string;
  simulated: boolean;
};
