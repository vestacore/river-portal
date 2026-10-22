import { intlTag, type Locale } from '@river/i18n';

/** A change of a rate in percentage points, signed — basis points in: −59 → `−0.59 pp` / `−0,59 п. п.`. */
export function pointsText(bps: number, locale: Locale): string {
  const n = new Intl.NumberFormat(intlTag(locale), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(bps) / 100);
  const sign = bps > 0 ? '+' : bps < 0 ? '−' : '±';
  return `${sign}${n} ${locale === 'uk' ? 'п. п.' : 'pp'}`;
}
