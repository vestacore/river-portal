import { siteBlocks } from './data/siteBlocks.ts';
import type { BlockDefinition } from './types/BlockDefinition.ts';

/** The definition of an editable block, or undefined for unknown ids. */
export function findBlockDefinition(blockId: string): BlockDefinition | undefined {
  return siteBlocks.find((b) => b.id === blockId);
}
