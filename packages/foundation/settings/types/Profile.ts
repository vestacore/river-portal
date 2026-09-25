import type { LocalisedText } from '@river/i18n';
import type { ProfileId } from './ProfileId.ts';
import type { SettingValue } from './SettingValue.ts';

/** A preset of setting values for one kind of organisation. */
export type Profile = { id: ProfileId; label: LocalisedText; description: LocalisedText; values: Record<string, SettingValue> };
