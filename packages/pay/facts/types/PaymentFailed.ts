import type { ProviderName } from './ProviderName.ts';

/** `payment.Failed` — the world: the payer declined or the provider refused; no money moved. The attempt is over. */
export type PaymentFailed = {
  provider: ProviderName;
  sessionRef: string;
  reason: string;
};
