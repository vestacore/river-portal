import { oblastName, type Locale } from '@river/i18n';
import type { RecipientKind } from './types/RecipientKind.ts';

/**
 * The only way a recipient appears outside `team`: a pseudonymised phrase at oblast level,
 * e.g. "a family in Kharkiv oblast" / "родина в Харківській області".
 */
export function describeRecipientPublicly(kind: RecipientKind, oblastId: string, locale: Locale): string {
  if (locale === 'uk') {
    const where = oblastName(oblastId, 'uk', 'loc');
    // Euphony: every `who` ends in a vowel, so "в" — except before в/ф and hard clusters (у Вінницькій, у Львівській).
    const prep = /^(в|ф|льв|св|тв|хв|зв)/i.test(where) ? 'у' : 'в';
    const who = { self: 'людина', family: 'родина', neighbours: 'сусіди', institution: 'установа' }[kind];
    return `${who} ${prep} ${where}`;
  }
  const where = oblastName(oblastId, 'en-GB');
  const who = { self: 'a resident', family: 'a family', neighbours: 'a group of neighbours', institution: 'a local institution' }[kind];
  return `${who} in ${where}`;
}
