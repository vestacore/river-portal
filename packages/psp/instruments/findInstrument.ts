import { instrumentCatalogue } from './data/instrumentCatalogue.ts';
import type { InstrumentDefinition } from './types/Instrument.ts';

/** The definition of an instrument; throws for an id the catalogue does not know. */
export function findInstrument(id: string): InstrumentDefinition {
  const found = instrumentCatalogue.find((i) => i.id === id);
  if (!found) throw new Error(`Unknown instrument ${id}`);
  return found;
}
