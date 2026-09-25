import { createMemoryStore } from '@river/store';
import type { ProfileId } from '@river/settings';
import { seedDemo } from './seedDemo.ts';
import type { Runtime } from './types/Runtime.ts';

/**
 * Demo only: replaces the in-memory store with fresh demo data for a profile, so each profile can be
 * tested with coherent content. Refused for Firestore, where data is never thrown away.
 */
export async function resetDemo(runtime: Runtime, profileId: ProfileId): Promise<void> {
  if (runtime.config.store !== 'memory') throw new Error('Demo reset is only available with the memory store');
  runtime.store = createMemoryStore();
  runtime.demoTrackingLinks = {};
  await seedDemo(runtime, profileId);
}
