/** The form in which help is needed: water arrives as it is needed. */
export const helpForms = ['goods', 'money', 'service', 'transport'] as const;
export type HelpForm = (typeof helpForms)[number];
