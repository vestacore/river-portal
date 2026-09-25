import { settingEntries, settingText, type SettingsSnapshot } from '@river/settings';

/** Rate from `currency` to the reporting currency (from settings), or null when unknown. */
export function fxRateFor(settings: SettingsSnapshot, currency: string): number | null {
  if (currency === settingText(settings, 'money.reportingCurrency')) return 1;
  const row = settingEntries<{ currency: string; rate: string }>(settings, 'money.fxRates').find((r) => r.currency === currency);
  const rate = row ? Number(row.rate) : Number.NaN;
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}
