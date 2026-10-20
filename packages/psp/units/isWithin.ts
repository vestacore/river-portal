import type { Unit } from './types/Unit.ts';

/** Whether `unitId` is `scopeId` or lies below it — the one test of visibility in the hierarchy. */
export function isWithin(units: readonly Unit[], unitId: string, scopeId: string): boolean {
  const byId = new Map(units.map((u) => [u.id, u]));
  let current = byId.get(unitId);
  for (let guard = 0; current && guard < 64; guard += 1) {
    if (current.id === scopeId) return true;
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return false;
}
