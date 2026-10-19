import type { Currency, ProviderName } from '@river/pay-facts';

/** One line of the routing table: a provider, what it carries, and the reason recorded with the choice. */
export type RoutingRule = {
  provider: ProviderName;
  currencies: readonly Currency[];
  maxMinor: number | null;
  why: string;
};
