import type { SettingsSnapshot } from './types/SettingsSnapshot.ts';

/** A boolean setting (false when missing). */
export function settingBoolean(snapshot: SettingsSnapshot, key: string): boolean {
  return snapshot.values[key] === true;
}
