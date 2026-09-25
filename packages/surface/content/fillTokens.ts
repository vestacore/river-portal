import { escapeHtml } from './escapeHtml.ts';

/** Replaces {{key}} tokens in rendered HTML with escaped setting values (unknown tokens become empty). */
export function fillTokens(html: string, tokens: Readonly<Record<string, string>>): string {
  return html.replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9.]*)\s*\}\}/g, (_, key: string) => escapeHtml(tokens[key] ?? ''));
}
