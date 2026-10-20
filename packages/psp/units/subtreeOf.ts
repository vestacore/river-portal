import type { Unit } from './types/Unit.ts';

/** A unit and every unit below it, depth first: the flows a unit sees and steers. */
export function subtreeOf(units: readonly Unit[], unitId: string): Unit[] {
  const root = units.find((u) => u.id === unitId);
  if (!root) return [];
  const out: Unit[] = [];
  const visit = (unit: Unit) => {
    out.push(unit);
    for (const child of units.filter((u) => u.parentId === unit.id)) visit(child);
  };
  visit(root);
  return out;
}
