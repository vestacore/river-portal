import type { ProfileId, SettingValue } from '@river/settings';

/** The stored settings of an organisation (`orgs/{org}/config/settings`, team): profile and overrides. */
export type ConfigDoc = {
  profileId: ProfileId;
  overrides: Record<string, SettingValue>;
  updatedAt: string;
  updatedBy: string;
};
