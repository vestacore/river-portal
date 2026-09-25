/** Groups of settings as they appear in the studio. */
export const settingGroups = ['organisation', 'contact', 'help', 'giving', 'money', 'publication', 'home', 'appearance'] as const;
export type SettingGroup = (typeof settingGroups)[number];
