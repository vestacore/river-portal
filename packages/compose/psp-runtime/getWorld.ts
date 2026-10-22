import { pspStand } from './data/pspStand.ts';
import { retailStand } from './data/retailStand.ts';
import { createWorld } from './createWorld.ts';
import { refreshSwarm } from './refreshSwarm.ts';
import { seedHistory } from './seedHistory.ts';
import { seedOnboarding } from './seedOnboarding.ts';
import { seedRetail } from './seedRetail.ts';
import type { StandId, World } from './types/World.ts';

const key = Symbol.for('river.stands');
type Holder = { [key]?: Partial<Record<StandId, World>> };

// Raised whenever a stand's story changes, so a running development server replays it afresh.
const seedVersion = 14;

/**
 * The process-wide world of one stand, kept on globalThis so development reloads reuse it. It is created
 * with its history the first time anyone asks — relative to that moment — and lives in memory only.
 * `fresh` starts the stand again from the beginning.
 */
export function getWorld(stand: StandId, fresh = false): World {
  const holder = globalThis as Holder;
  const worlds = (holder[key] ??= {});
  const existing = worlds[stand];
  if (fresh || !existing || existing.counters.seedVersion !== seedVersion) {
    const now = new Date().toISOString();
    const world = createWorld(now, stand === 'retail' ? retailStand : pspStand);
    if (stand === 'retail') seedRetail(world, now);
    else { seedHistory(world, now); seedOnboarding(world, now); }
    refreshSwarm(world, now);
    world.counters.seedVersion = seedVersion;
    worlds[stand] = world;
  }
  return worlds[stand]!;
}
