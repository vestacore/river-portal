import { nearestOfKind } from '@river/psp-units';
import type { World } from './types/World.ts';

/** Which licensed entity a unit trades under: Ukraine or Europe. */
export function regionOf(world: World, unitId: string): 'UA' | 'EU' {
  return nearestOfKind(world.units, unitId, 'entity')?.id === 'ou-eu' ? 'EU' : 'UA';
}
