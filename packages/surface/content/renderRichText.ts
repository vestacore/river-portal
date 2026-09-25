import { escapeHtml } from './escapeHtml.ts';
import type { RichDoc, RichMark, RichNode } from './types/RichDoc.ts';

const blockTags: Record<string, string> = {
  paragraph: 'p', bulletList: 'ul', orderedList: 'ol', listItem: 'li', blockquote: 'blockquote',
};

function safeHref(mark: RichMark): string | null {
  const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href : '';
  return /^(https?:\/\/|mailto:|\/)/i.test(href) ? href : null;
}

function renderText(node: RichNode, inline: boolean): string {
  let html = escapeHtml(node.text ?? '');
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') html = `<strong>${html}</strong>`;
    else if (mark.type === 'italic') html = `<em>${html}</em>`;
    else if (mark.type === 'link' && !inline) {
      const href = safeHref(mark);
      if (href) html = `<a href="${escapeHtml(href)}" rel="noopener nofollow">${html}</a>`;
    }
  }
  return html;
}

function renderNode(node: RichNode, inline: boolean): string {
  if (node.type === 'text') return renderText(node, inline);
  if (node.type === 'hardBreak') return '<br>';
  const inner = (node.content ?? []).map((child) => renderNode(child, inline)).join('');
  if (inline) return inner;
  if (node.type === 'heading') {
    const level = node.attrs?.level === 3 ? 3 : 2;
    return `<h${level}>${inner}</h${level}>`;
  }
  const tag = blockTags[node.type];
  return tag ? `<${tag}>${inner}</${tag}>` : inner;
}

/**
 * Renders Tiptap JSON to HTML on the server using an allow-list of nodes and marks, so no HTML
 * from a browser is ever stored or served. `inline` mode flattens to text with bold/italic.
 */
export function renderRichText(doc: RichDoc, mode: 'inline' | 'rich'): string {
  const inline = mode === 'inline';
  return (doc.content ?? []).map((node) => renderNode(node, inline)).join(inline ? ' ' : '');
}
