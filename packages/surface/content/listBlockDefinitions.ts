import { pageBlocks } from './data/pageBlocks.ts';
import { siteBlocks } from './data/siteBlocks.ts';
import type { BlockDefinition } from './types/BlockDefinition.ts';

/** Every editable block: site texts and page texts (about, policies, questions and answers). */
export function listBlockDefinitions(): readonly BlockDefinition[] {
  return [...siteBlocks, ...pageBlocks];
}
