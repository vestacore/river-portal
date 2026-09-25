import type { Locale } from '@river/i18n';
import { findBlockDefinition } from './findBlockDefinition.ts';
import { plainToRichDoc } from './plainToRichDoc.ts';
import { renderRichText } from './renderRichText.ts';
import type { BlockMap } from './types/BlockMap.ts';
import type { RichText } from './types/RichText.ts';

/** The current text of a block in `locale`: the edited version, or the default. */
export function resolveBlock(blocks: BlockMap | undefined, blockId: string, locale: Locale): RichText & { mode: 'inline' | 'rich' } {
  const definition = findBlockDefinition(blockId);
  const mode = definition?.mode ?? 'rich';
  const edited = blocks?.[blockId]?.[locale];
  if (edited) return { ...edited, mode };
  const doc = plainToRichDoc(definition?.defaults[locale] ?? '');
  return { doc, html: renderRichText(doc, mode), mode };
}
