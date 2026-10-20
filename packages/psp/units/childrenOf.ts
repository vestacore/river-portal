import type { Unit } from './types/Unit.ts';

/** The units directly below a unit, in the order they are kept. */
export function childrenOf(units: readonly Unit[], unitId: string): Unit[] {
  return units.filter((u) => u.parentId === unitId);
}
