/** How a setting's value is shaped and edited. */
export const settingKinds = [
  'text', 'localisedText', 'number', 'money', 'boolean', 'choice', 'multiChoice', 'orderedChoices',
  'numbers', 'entries', 'colour', 'email', 'phone', 'url',
] as const;
export type SettingKind = (typeof settingKinds)[number];
