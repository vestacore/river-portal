import type { ProviderName } from './ProviderName.ts';

/** `providerSession.Failed` — the world: the provider did not open a session. The attempt is over. */
export type ProviderSessionFailed = {
  provider: ProviderName;
  attempt: number;
  reason: string;
};
