import { getWorld } from './getWorld.ts';
import type { World } from './types/World.ts';

/** The PSP stand's world (see `getWorld`). */
export function getPspWorld(fresh = false): World {
  return getWorld('psp', fresh);
}
