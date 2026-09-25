import type { SettingsSnapshot } from './types/SettingsSnapshot.ts';

/** A list setting (choices, ordered choices or numbers). */
export function settingList<T extends string | number = string>(snapshot: SettingsSnapshot, key: string): T[] {
  const v = snapshot.values[key];
  return Array.isArray(v) ? (v as T[]) : [];
}
