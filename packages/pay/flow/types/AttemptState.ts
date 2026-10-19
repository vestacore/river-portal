import type { ProviderName } from '@river/pay-facts';

/**
 * Where the attempts of one order stand: how many have started, the one under way, and which
 * providers have failed. `capture` follows the attempt under way through the collecting of money:
 * not asked for; asked of the provider and not yet answered; or accepted by the provider and
 * pending its own verdict.
 */
export type AttemptState = {
  attempt: number;
  open: { provider: ProviderName; sessionRef: string | null; capture: 'none' | 'asked' | 'pending' } | null;
  failed: ProviderName[];
};
