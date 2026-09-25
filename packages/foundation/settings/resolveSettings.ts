import { definitions } from './data/definitions.ts';
import { findProfile } from './findProfile.ts';
import type { SettingsSnapshot, SettingSource } from './types/SettingsSnapshot.ts';
import type { SettingValue } from './types/SettingValue.ts';

/**
 * Resolves every registered setting: registry default, then the profile's value, then a custom
 * override. Unknown override keys are ignored, so removed settings never leak into the snapshot.
 */
export function resolveSettings(profileId: string | undefined, overrides: Record<string, SettingValue> = {}): SettingsSnapshot {
  const profile = findProfile(profileId);
  const values: Record<string, SettingValue> = {};
  const sources: Record<string, SettingSource> = {};
  for (const d of definitions) {
    if (d.key in overrides) { values[d.key] = overrides[d.key] as SettingValue; sources[d.key] = 'custom'; }
    else if (d.key in profile.values) { values[d.key] = profile.values[d.key] as SettingValue; sources[d.key] = 'profile'; }
    else { values[d.key] = d.default; sources[d.key] = 'default'; }
  }
  return { profileId: profile.id, values, sources };
}
