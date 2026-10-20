import type { Unit } from './types/Unit.ts';

/** The path from the root down to a unit, the unit last. Empty for a unit that does not exist. */
export function ancestorsOf(units: readonly Unit[], unitId: string): Unit[] {
  const byId = new Map(units.map((u) => [u.id, u]));
  const path: Unit[] = [];
  let current = byId.get(unitId);
  while (current) {
    if (path.includes(current)) throw new Error(`The hierarchy has a cycle at ${current.id}`);
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}
