import type { RichDoc, RichNode } from './types/RichDoc.ts';

function toPlain(node: RichNode): string {
  if (node.type === 'text') return node.text ?? '';
  if (node.type === 'hardBreak') return '\n';
  const inner = (node.content ?? []).map(toPlain).join('');
  return ['paragraph', 'heading', 'listItem', 'blockquote'].includes(node.type) ? `${inner}\n\n` : inner;
}

/** Plain text of a rich document (for AI prompts, search and previews). */
export function richDocToPlain(doc: RichDoc): string {
  return (doc.content ?? []).map(toPlain).join('').replace(/\n{3,}/g, '\n\n').trim();
}
