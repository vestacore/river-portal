import { oblasts } from './data/oblasts.ts';
import type { GrammaticalCase } from './types/GrammaticalCase.ts';
import type { Locale } from './types/Locale.ts';

const endings: Record<GrammaticalCase, [string, string]> = {
  nom: ['а', 'область'],
  gen: ['ої', 'області'],
  loc: ['ій', 'області'],
};

/** Oblast name for public phrases, in the requested Ukrainian grammatical case. */
export function oblastName(id: string, locale: Locale, grammaticalCase: GrammaticalCase = 'nom'): string {
  const oblast = oblasts.find((o) => o.id === id);
  if (!oblast) return locale === 'uk' ? 'Україна' : 'Ukraine';
  if (locale === 'en-GB') return oblast.en;
  if (oblast.ukForms) return oblast.ukForms[grammaticalCase];
  const [ending, noun] = endings[grammaticalCase];
  return `${oblast.ukStem}${ending} ${noun}`;
}
