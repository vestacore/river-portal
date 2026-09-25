import type { Locale } from '@river/i18n';
import { commit, type CommandEnv } from '@river/log';
import { findBlockDefinition } from './findBlockDefinition.ts';
import { isRichDoc } from './isRichDoc.ts';
import { renderRichText } from './renderRichText.ts';

/** An editor changes a site text in the studio (ADR-0022). HTML is rendered here, never accepted from the browser. */
export async function editContentBlock(env: CommandEnv, input: { blockId: string; locale: Locale; doc: unknown }): Promise<void> {
  const definition = findBlockDefinition(input.blockId);
  if (!definition) throw new Error(`Unknown block ${input.blockId}`);
  if (!isRichDoc(input.doc)) throw new Error('Invalid document');
  const html = renderRichText(input.doc, definition.mode);
  await commit(env, [
    {
      type: 'content.BlockEdited',
      aggregate: { kind: 'content', id: input.blockId },
      visibility: 'public',
      payload: { blockId: input.blockId, locale: input.locale, doc: input.doc, html },
    },
  ]);
}
