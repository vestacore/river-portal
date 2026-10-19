import type { ProviderName } from './ProviderName.ts';

/** `provider.Routed` — a figure: which provider carries this attempt, and the rule that chose it. */
export type ProviderRouted = {
  provider: ProviderName;
  reason: string;
  attempt: number;
};
