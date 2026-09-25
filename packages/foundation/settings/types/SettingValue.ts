import type { LocalisedText } from '@river/i18n';

/** One row of an `entries` setting (for example a referral or a partner). */
export type EntryValue = Record<string, string | LocalisedText>;

/** Any setting value. Money is stored in minor units of the reporting currency. */
export type SettingValue = string | number | boolean | LocalisedText | string[] | number[] | EntryValue[];
