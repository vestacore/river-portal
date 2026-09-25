import { intlTag } from './intlTag.ts';
import type { Locale } from './types/Locale.ts';

/** Human date: `24 September 2026` / `24 вересня 2026 р.`; `withTime` adds hours and minutes. */
export function formatDate(iso: string, locale: Locale, withTime = false): string {
  return new Intl.DateTimeFormat(intlTag(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Europe/Kyiv',
  }).format(new Date(iso));
}
