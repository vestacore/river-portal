import type { ProfileId } from './ProfileId.ts';
import type { SettingValue } from './SettingValue.ts';

/** Where a resolved value came from: the registry default, the active profile, or a custom value. */
export type SettingSource = 'default' | 'profile' | 'custom';

/** All settings resolved for use: default → profile → custom, in that order of precedence. */
export type SettingsSnapshot = {
  profileId: ProfileId;
  values: Record<string, SettingValue>;
  sources: Record<string, SettingSource>;
};
