import type { ProviderName } from './ProviderName.ts';

/**
 * `providerSession.Expired` — the world: a session the payer never completed is over. The provider
 * reports it, or — where the provider stays silent — the clock does. It ends the attempt only while
 * nothing is being collected in that session.
 */
export type ProviderSessionExpired = {
  provider: ProviderName;
  sessionRef: string;
  reason: string;
};
