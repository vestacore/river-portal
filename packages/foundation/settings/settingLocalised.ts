import type { LocalisedText } from '@river/i18n';
import type { SettingsSnapshot } from './types/SettingsSnapshot.ts';

/** A localised text setting (empty strings when missing). */
export function settingLocalised(snapshot: SettingsSnapshot, key: string): LocalisedText {
  const v = snapshot.values[key];
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as LocalisedText) : { 'en-GB': '', uk: '' };
}
