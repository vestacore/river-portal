import type { SettingsSnapshot } from './types/SettingsSnapshot.ts';

/** A number or money setting (0 when missing). */
export function settingNumber(snapshot: SettingsSnapshot, key: string): number {
  const v = snapshot.values[key];
  return typeof v === 'number' ? v : 0;
}
