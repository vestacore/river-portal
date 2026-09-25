import type { RichDoc, RichNode } from './types/RichDoc.ts';

function inline(line: string): RichNode[] {
  return line ? [{ type: 'text', text: line }] : [];
}

/**
 * Plain text to a rich document, with a tiny, safe subset of Markdown for default texts:
 * blank lines separate blocks; a block starting with "## " is a heading; a block whose lines all
 * start with "- " is a bullet list; single newlines inside a paragraph become breaks.
 */
export function plainToRichDoc(text: string): RichDoc {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const content: RichNode[] = blocks.map((block): RichNode => {
    if (block.startsWith('## ')) return { type: 'heading', attrs: { level: 2 }, content: inline(block.slice(3).trim()) };
    const lines = block.split('\n');
    if (lines.every((l) => l.trim().startsWith('- '))) {
      return {
        type: 'bulletList',
        content: lines.map((l) => ({ type: 'listItem', content: [{ type: 'paragraph', content: inline(l.trim().slice(2).trim()) }] })),
      };
    }
    const nodes: RichNode[] = [];
    lines.forEach((line, i) => {
      if (i > 0) nodes.push({ type: 'hardBreak' });
      nodes.push(...inline(line));
    });
    return { type: 'paragraph', content: nodes };
  });
  return { type: 'doc', content };
}
