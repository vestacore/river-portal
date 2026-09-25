import { intlTag } from './intlTag.ts';
import type { Locale } from './types/Locale.ts';

/** Integer with locale grouping (1,234 / 1 234). */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlTag(locale)).format(value);
}
