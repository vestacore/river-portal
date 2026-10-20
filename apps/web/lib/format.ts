import { intlTag, type Locale } from '@river/i18n';

const zone = 'Europe/Kyiv';

/** Money from minor units, always with two decimals in tables; `compact` for large figures on dashboards. */
export function money(minor: number, currency: string, locale: Locale, compact = false): string {
  if (compact && Math.abs(minor) >= 10_000_000) {
    return new Intl.NumberFormat(intlTag(locale), { style: 'currency', currency, currencyDisplay: 'narrowSymbol', notation: 'compact', maximumFractionDigits: 2 }).format(minor / 100);
  }
  return new Intl.NumberFormat(intlTag(locale), { style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minor / 100);
}

/** A whole number with the locale's grouping. */
export function count(n: number, locale: Locale): string {
  return new Intl.NumberFormat(intlTag(locale)).format(n);
}

/** Basis points as a percentage: 9350 → 93.5 %. */
export function percent(bps: number, locale: Locale, digits = 1): string {
  return `${new Intl.NumberFormat(intlTag(locale), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(bps / 100)} %`;
}

/** A moment in tables: day, month and time — `19 Oct, 14:32` / `19 жовт., 14:32`. */
export function when(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlTag(locale), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: zone }).format(new Date(iso));
}

/** A day: `19 Oct 2026` / `19 жовт. 2026 р.`. */
export function day(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlTag(locale), { day: 'numeric', month: 'short', year: 'numeric', timeZone: zone }).format(new Date(iso));
}

/** A moment to the second, for the facts of a stream. */
export function exact(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlTag(locale), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: zone }).format(new Date(iso));
}

/** How long ago, roughly: `5 min ago`, `3 h ago`, `2 days ago`. */
export function ago(iso: string, now: string, locale: Locale): string {
  const minutes = Math.round((Date.parse(now) - Date.parse(iso)) / 60_000);
  const rtf = new Intl.RelativeTimeFormat(intlTag(locale), { numeric: 'auto', style: 'short' });
  if (Math.abs(minutes) < 60) return rtf.format(-minutes, 'minute');
  if (Math.abs(minutes) < 48 * 60) return rtf.format(-Math.round(minutes / 60), 'hour');
  return rtf.format(-Math.round(minutes / 1_440), 'day');
}
