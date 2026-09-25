import type { SettingKind, SettingSource, SettingValue } from '@river/settings';

/** One setting as the studio form shows it: labels in the viewer's language, choices resolved. */
export type FieldView = {
  key: string;
  kind: SettingKind;
  label: string;
  help: string | null;
  value: SettingValue;
  source: SettingSource;
  editable: boolean;
  editors: string;
  min?: number;
  max?: number;
  currency?: string;
  choices?: Array<{ value: string; label: string }>;
  fields?: Array<{ key: string; label: string; kind: string; choices?: Array<{ value: string; label: string }> }>;
};
