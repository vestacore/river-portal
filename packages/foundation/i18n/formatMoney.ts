import { intlTag } from './intlTag.ts';
import type { Locale } from './types/Locale.ts';

/** Money from minor units (pence, kopiykas); whole amounts are shown without decimals. */
export function formatMoney(amountMinor: number, currency: string, locale: Locale): string {
  const whole = amountMinor % 100 === 0;
  return new Intl.NumberFormat(intlTag(locale), {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amountMinor / 100);
}
