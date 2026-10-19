import { intlTag, type Locale } from '@river/i18n';

/**
 * Money in the payment river: always to the minor unit ("€120.00", never "€120"), so that amounts,
 * commissions and balances line up and a receipt says exactly what was paid.
 */
export function payMoney(amountMinor: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(intlTag(locale), { style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amountMinor / 100);
}
