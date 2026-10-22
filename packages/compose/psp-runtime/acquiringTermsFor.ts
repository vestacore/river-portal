import type { AcquiringTerms } from '@river/psp-contracts';
import type { World } from './types/World.ts';

/** The merchant's acquiring terms with one provider for a channel, if it has any. */
export function acquiringTermsFor(world: World, merchantId: string, acquirerId: string, channel: 'online' | 'in_store'): AcquiringTerms | null {
  return world.acquiring.find((t) => t.merchantId === merchantId && t.acquirerId === acquirerId && t.channel === channel) ?? null;
}
