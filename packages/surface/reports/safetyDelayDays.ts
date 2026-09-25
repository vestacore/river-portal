import { settingNumber, type SettingsSnapshot } from '@river/settings';

/** Minimum days between a delivery in a conflict zone and a public story (a setting with a floor of 14). */
export function safetyDelayDays(settings: SettingsSnapshot): number {
  return Math.max(14, settingNumber(settings, 'publication.safetyDelayDays'));
}
