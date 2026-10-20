import { subtreeOf } from '@river/psp-units';
import type { Actor, World } from './types/World.ts';

/** The units an actor sees: the subtree of the unit their profile is granted at (or of a narrower unit they chose inside it). */
export function visibleUnits(world: World, actor: Extract<Actor, { kind: 'person' }>, focusUnitId?: string | null): Set<string> {
  const reach = new Set(subtreeOf(world.units, actor.unitId).map((u) => u.id));
  const focus = focusUnitId && reach.has(focusUnitId) ? focusUnitId : actor.unitId;
  return new Set(subtreeOf(world.units, focus).map((u) => u.id));
}
