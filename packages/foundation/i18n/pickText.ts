import type { Locale } from './types/Locale.ts';
import type { LocalisedText } from './types/LocalisedText.ts';

/** The text in `locale`, falling back to British English, then to any non-empty text. */
export function pickText(text: Partial<LocalisedText> | undefined, locale: Locale): string {
  if (!text) return '';
  return text[locale] || text['en-GB'] || Object.values(text).find(Boolean) || '';
}
