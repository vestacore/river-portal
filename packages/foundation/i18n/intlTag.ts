import type { Locale } from './types/Locale.ts';

/** The Intl locale tag used for formatting (Ukrainian formats as uk-UA). */
export function intlTag(locale: Locale): string {
  return locale === 'uk' ? 'uk-UA' : 'en-GB';
}
