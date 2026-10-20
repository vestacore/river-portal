import { nearestOfKind } from '@river/psp-units';
import type { World } from './types/World.ts';

/** The merchant a selling unit belongs to (itself, when it is the merchant). */
export function merchantOf(world: World, unitId: string): string {
  return nearestOfKind(world.units, unitId, 'merchant')?.id ?? unitId;
}
