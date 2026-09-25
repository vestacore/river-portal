import type { Locale } from '@river/i18n';
import { fillTokens } from './fillTokens.ts';
import { findBlockDefinition } from './findBlockDefinition.ts';
import { plainToRichDoc } from './plainToRichDoc.ts';
import { renderRichText } from './renderRichText.ts';
import type { BlockMap } from './types/BlockMap.ts';
import type { RichText } from './types/RichText.ts';

/**
 * The current text of a block in `locale`: the edited version, or the default; {{key}} tokens are
 * filled from the organisation's public settings.
 */
export function resolveBlock(
  blocks: BlockMap | undefined,
  blockId: string,
  locale: Locale,
  tokens: Readonly<Record<string, string>> = {},
): RichText & { mode: 'inline' | 'rich' } {
  const definition = findBlockDefinition(blockId);
  const mode = definition?.mode ?? 'rich';
  const edited = blocks?.[blockId]?.[locale];
  if (edited) return { ...edited, html: fillTokens(edited.html, tokens), mode };
  const doc = plainToRichDoc(definition?.defaults[locale] ?? '');
  return { doc, html: fillTokens(renderRichText(doc, mode), tokens), mode };
}
