import type { ProviderName } from '@river/pay-facts';

/**
 * A seller on the river: its name for the cabinets, the providers it has connected, and — where it
 * has its own account with a provider — the reference that lets the provider split a payment itself.
 * Configuration, not a fact: only the merchant's id enters a stream.
 */
export type Merchant = {
  id: string;
  name: string;
  providers: ProviderName[];
  stripeAccount: string | null;
  paypalMerchantId: string | null;
};
