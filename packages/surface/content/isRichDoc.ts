import type { RichDoc } from './types/RichDoc.ts';

/** Structural check for documents coming from the browser, with a size limit (50 KB of JSON). */
export function isRichDoc(value: unknown): value is RichDoc {
  if (!value || typeof value !== 'object') return false;
  const doc = value as { type?: unknown; content?: unknown };
  return doc.type === 'doc' && Array.isArray(doc.content) && JSON.stringify(value).length <= 50_000;
}
