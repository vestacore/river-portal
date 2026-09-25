import type { SettingsSnapshot } from './types/SettingsSnapshot.ts';

/** Rows of an `entries` setting, typed by the caller (for example `ReferralEntry`). */
export function settingEntries<T>(snapshot: SettingsSnapshot, key: string): T[] {
  const v = snapshot.values[key];
  return Array.isArray(v) ? (v as unknown as T[]) : [];
}
