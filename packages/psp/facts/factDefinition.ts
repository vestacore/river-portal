import { factCatalogue } from './data/factCatalogue.ts';
import type { FactDefinition } from './types/FactDefinition.ts';

const byType = new Map(factCatalogue.map((definition) => [definition.type, definition]));

/** The contract of a fact type; throws for a type the catalogue does not know (it cannot exist). */
export function factDefinition(type: string): FactDefinition {
  const definition = byType.get(type as FactDefinition['type']);
  if (!definition) throw new Error(`Unknown fact type ${type}`);
  return definition;
}
