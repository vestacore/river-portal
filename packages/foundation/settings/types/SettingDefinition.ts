import type { LocalisedText } from '@river/i18n';
import type { EntryField } from './EntryField.ts';
import type { SettingChoice } from './SettingChoice.ts';
import type { SettingGroup } from './SettingGroup.ts';
import type { SettingKind } from './SettingKind.ts';
import type { SettingValue } from './SettingValue.ts';

/**
 * A registered setting (adr/records/ADR-0020). `audience: 'public'` values may appear on public
 * pages; `team` values are only used by the system and the studio. `floor` is a canonical minimum
 * that neither a profile nor an administrator may go below (spec: Canonical Parameters).
 * `choicesFrom` takes choices from reference data (oblasts, categories) instead of `choices`.
 */
export type SettingDefinition = {
  key: string;
  group: SettingGroup;
  kind: SettingKind;
  label: LocalisedText;
  help?: LocalisedText;
  audience: 'public' | 'team';
  min?: number;
  max?: number;
  floor?: number;
  choices?: SettingChoice[];
  choicesFrom?: 'oblasts' | 'categories';
  fields?: EntryField[];
  default: SettingValue;
  editableBy: ReadonlyArray<'administrator' | 'editor'>;
};
