import { factCatalogue } from './data/factCatalogue.ts';
import type { Projection } from './types/Boundary.ts';
import type { FactType } from './types/PayloadMap.ts';

/** The fact types that form a projection: what its projector must hear, and nothing else. */
export function factsFormingOf(projection: Projection): FactType[] {
  return factCatalogue.filter((definition) => definition.forms.includes(projection)).map((definition) => definition.type);
}
