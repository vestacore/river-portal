import { pluralise, type Locale } from '@river/i18n';

/** A number with its noun in the right plural form: `874 attempts`, `874 спроби`, `116 платежів`. */
export function countText(n: number, locale: Locale, en: [one: string, other: string], uk: [one: string, few: string, many: string]): string {
  return locale === 'uk'
    ? pluralise(n, locale, { one: `{n} ${uk[0]}`, few: `{n} ${uk[1]}`, many: `{n} ${uk[2]}`, other: `{n} ${uk[1]}` })
    : pluralise(n, locale, { one: `{n} ${en[0]}`, other: `{n} ${en[1]}` });
}
