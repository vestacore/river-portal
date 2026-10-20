import type { Projection } from './Boundary.ts';
import type { FactType } from './PayloadMap.ts';
import type { PspFact } from './PspFact.ts';

/**
 * A boundary's reading: it hears some fact types — its own and other boundaries' — finds which of its
 * views a fact concerns (`keyOf`), and folds the fact into that view with a pure step. A view can
 * always be rebuilt by replaying the facts it heard, in order.
 */
export type Projector<V> = {
  projection: Projection;
  hears: readonly FactType[];
  keyOf: (fact: PspFact) => string | null;
  project: (view: V | null, fact: PspFact) => V | null;
};
