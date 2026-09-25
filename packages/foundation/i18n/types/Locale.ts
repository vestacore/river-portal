/** Supported UI and content locales. BCP 47 tags; URL segments are lower case. */
export const locales = ['en-GB', 'uk'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en-GB';
