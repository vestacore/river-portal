import { factCatalogue } from './data/factCatalogue.ts';
import type { FactType } from './types/PayloadMap.ts';

const known = new Set<string>(factCatalogue.map((definition) => definition.type));

/** Whether a string names a fact type of the PSP. */
export function isFactType(type: string): type is FactType {
  return known.has(type);
}
