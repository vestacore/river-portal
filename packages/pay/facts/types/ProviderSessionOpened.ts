import type { ProviderName } from './ProviderName.ts';

/** `providerSession.Opened` — the world: the provider's hosted page is ready at `redirectUrl`. */
export type ProviderSessionOpened = {
  provider: ProviderName;
  attempt: number;
  sessionRef: string;
  redirectUrl: string;
  simulated: boolean;
};
