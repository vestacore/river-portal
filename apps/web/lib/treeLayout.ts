import type { Unit } from '@river/psp-units';

export type TreeNode = { unit: Unit; x: number; y: number; depth: number; parent: string | null };

/**
 * A tidy layout of part of the hierarchy: leaves evenly spaced in depth-first order, every parent centred
 * over its children, one row per depth. `include` decides which units are drawn.
 */
export function treeLayout(units: readonly Unit[], rootId: string, include: (u: Unit) => boolean, width: number, rowHeight: number): TreeNode[] {
  const kids = (id: string) => units.filter((u) => u.parentId === id && include(u));
  const leaves: string[] = [];
  const walk = (id: string) => { const c = kids(id); if (c.length === 0) leaves.push(id); else c.forEach((k) => walk(k.id)); };
  walk(rootId);
  const step = width / Math.max(1, leaves.length);
  const nodes = new Map<string, TreeNode>();
  const place = (id: string, depth: number, parent: string | null): number => {
    const unit = units.find((u) => u.id === id)!;
    const c = kids(id);
    const x = c.length === 0 ? step / 2 + leaves.indexOf(id) * step : c.map((k) => place(k.id, depth + 1, id)).reduce((a, b) => a + b, 0) / c.length;
    nodes.set(id, { unit, x, y: 40 + depth * rowHeight, depth, parent });
    return x;
  };
  place(rootId, 0, null);
  return [...nodes.values()].sort((a, b) => a.depth - b.depth || a.x - b.x);
}
