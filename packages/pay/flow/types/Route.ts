import type { ProviderName } from '@river/pay-facts';

/** A routing decision: the provider and the rule that chose it. */
export type Route = {
  provider: ProviderName;
  reason: string;
};
