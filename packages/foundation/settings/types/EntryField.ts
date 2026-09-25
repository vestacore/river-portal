import type { LocalisedText } from '@river/i18n';
import type { SettingChoice } from './SettingChoice.ts';

/** One field of the rows in an `entries` setting. */
export type EntryField = {
  key: string;
  label: LocalisedText;
  kind: 'text' | 'localisedText' | 'url' | 'email' | 'phone' | 'choice' | 'number';
  choices?: SettingChoice[];
};
