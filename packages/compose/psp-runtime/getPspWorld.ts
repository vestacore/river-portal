import { createWorld } from './createWorld.ts';
import { refreshSwarm } from './refreshSwarm.ts';
import { seedHistory } from './seedHistory.ts';
import { seedOnboarding } from './seedOnboarding.ts';
import type { World } from './types/World.ts';

const key = Symbol.for('river.psp.world');
type Holder = { [key]?: World };

// Raised whenever the history's story changes, so a running development server replays it afresh.
const seedVersion = 8;

/**
 * The process-wide demo world, kept on globalThis so development reloads reuse it. It is created with its
 * history the first time anyone asks — relative to that moment — and lives in memory only. `fresh` starts
 * the stand again from the beginning.
 */
export function getPspWorld(fresh = false): World {
  const holder = globalThis as Holder;
  if (fresh || !holder[key] || holder[key].counters.seedVersion !== seedVersion) {
    const now = new Date().toISOString();
    const world = createWorld(now);
    seedHistory(world, now);
    seedOnboarding(world, now);
    refreshSwarm(world, now);
    world.counters.seedVersion = seedVersion;
    holder[key] = world;
  }
  return holder[key];
}
