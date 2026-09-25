import { notFound } from 'next/navigation';
import { localeFromSegment, type Locale } from '@river/i18n';

/** The locale for a route segment, or a 404 for unsupported segments. */
export function resolveLocale(segment: string): Locale {
  const locale = localeFromSegment(segment);
  if (!locale) notFound();
  return locale;
}
