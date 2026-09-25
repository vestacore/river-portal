import type { Locale } from './types/Locale.ts';

/** Maps a URL segment (`en-gb`, `uk`) to a locale, or null when unsupported. */
export function localeFromSegment(segment: string | undefined): Locale | null {
  if (!segment) return null;
  const s = segment.toLowerCase();
  if (s === 'en-gb') return 'en-GB';
  if (s === 'uk') return 'uk';
  return null;
}
