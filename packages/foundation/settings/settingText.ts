import type { SettingsSnapshot } from './types/SettingsSnapshot.ts';

/** A text setting ('' when missing). */
export function settingText(snapshot: SettingsSnapshot, key: string): string {
  const v = snapshot.values[key];
  return typeof v === 'string' ? v : '';
}
