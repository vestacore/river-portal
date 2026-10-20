import type { Unit, UnitKind } from './types/Unit.ts';

/** The unit itself or its nearest ancestor of a kind (the merchant of a store, the entity of a merchant), or null. */
export function nearestOfKind(units: readonly Unit[], unitId: string, kind: UnitKind): Unit | null {
  const byId = new Map(units.map((u) => [u.id, u]));
  let current = byId.get(unitId);
  for (let guard = 0; current && guard < 64; guard += 1) {
    if (current.kind === kind) return current;
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return null;
}
