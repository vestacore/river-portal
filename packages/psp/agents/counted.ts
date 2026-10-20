import { pluralise, type LocalisedText } from '@river/i18n';

/**
 * A number with its noun, in both languages, by each language's plural rules — so that the swarm never
 * writes "1 days" or "4 збоїв": `counted(3, ['share', 'shares'], ['частка', 'частки', 'часток'])`.
 * The Ukrainian forms are one, few and many; fractions take the "few" form.
 */
export function counted(n: number, en: [string, string], uk: [string, string, string]): LocalisedText {
  return {
    'en-GB': pluralise(n, 'en-GB', { one: `{n} ${en[0]}`, other: `{n} ${en[1]}` }),
    uk: pluralise(n, 'uk', { one: `{n} ${uk[0]}`, few: `{n} ${uk[1]}`, many: `{n} ${uk[2]}`, other: `{n} ${uk[1]}` }),
  };
}
