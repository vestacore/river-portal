import { settingEntries, type SettingsSnapshot } from '@river/settings';

/** Currencies a cost may be paid in: those with a conversion rate in settings (money.fxRates). */
export function costCurrencies(settings: SettingsSnapshot): string[] {
  return settingEntries<{ currency: string }>(settings, 'money.fxRates').map((e) => e.currency);
}
