import type { LocalisedText } from '@river/i18n';

/**
 * What the assistant may see: an already pseudonymised report (titles and plain text per locale)
 * and public facts. Callers must pass redacted text; the assistant redacts again defensively.
 */
export type SnippetRequest = {
  title: LocalisedText;
  body: LocalisedText;
  facts: Record<string, string | number>;
  maxItems: number;
};
