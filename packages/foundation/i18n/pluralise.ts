import { intlTag } from './intlTag.ts';
import type { Locale } from './types/Locale.ts';

/**
 * Picks the plural form for `count` using CLDR rules (Ukrainian has one/few/many/other)
 * and substitutes `{n}`. Missing forms fall back to `other`.
 */
export function pluralise(
  count: number,
  locale: Locale,
  forms: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string },
): string {
  const rule = new Intl.PluralRules(intlTag(locale)).select(count);
  const template = forms[rule] ?? forms.other;
  return template.replace('{n}', new Intl.NumberFormat(intlTag(locale)).format(count));
}
