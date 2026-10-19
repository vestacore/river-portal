import type { ProviderName } from './ProviderName.ts';

/** `providerSession.Approved` — the world: the payer approved, and the provider waits to be asked to capture. */
export type ProviderSessionApproved = {
  provider: ProviderName;
  sessionRef: string;
};
