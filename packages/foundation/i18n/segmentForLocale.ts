import type { Locale } from './types/Locale.ts';

/** URL segment for a locale (`en-gb`, `uk`). */
export function segmentForLocale(locale: Locale): string {
  return locale.toLowerCase();
}
