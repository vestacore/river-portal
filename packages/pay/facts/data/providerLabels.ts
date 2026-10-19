import type { ProviderName } from '../types/ProviderName.ts';

/** The providers' own names, as they write them. Proper nouns: the same in every language. */
export const providerLabels: Readonly<Record<ProviderName, string>> = { stripe: 'Stripe', paypal: 'PayPal' };
