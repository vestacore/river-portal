import { segmentForLocale, type Locale } from '@river/i18n';

/** A locale-prefixed internal link. */
export function href(locale: Locale, path = ''): string {
  return `/${segmentForLocale(locale)}${path.startsWith('/') || path === '' ? path : `/${path}`}`;
}
