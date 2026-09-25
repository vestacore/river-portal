import { listBlockDefinitions } from './listBlockDefinitions.ts';
import type { BlockDefinition } from './types/BlockDefinition.ts';

/** The definition of an editable block, or undefined for unknown ids. */
export function findBlockDefinition(blockId: string): BlockDefinition | undefined {
  return listBlockDefinitions().find((b) => b.id === blockId);
}
