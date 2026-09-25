import type { RichDoc, RichNode } from './types/RichDoc.ts';

/** Plain text to a rich document: blank lines separate paragraphs, single newlines become breaks. */
export function plainToRichDoc(text: string): RichDoc {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return {
    type: 'doc',
    content: paragraphs.map((p): RichNode => {
      const content: RichNode[] = [];
      p.split('\n').forEach((line, i) => {
        if (i > 0) content.push({ type: 'hardBreak' });
        if (line) content.push({ type: 'text', text: line });
      });
      return { type: 'paragraph', content };
    }),
  };
}
