import type { Locale } from '@river/i18n';
import { enGB } from './enGB.ts';
import type { Dictionary } from './types.ts';
import { uk } from './uk.ts';

/** UI strings for a locale. */
export function getDictionary(locale: Locale): Dictionary {
  return locale === 'uk' ? uk : enGB;
}
