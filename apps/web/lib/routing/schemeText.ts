import type { Locale } from '@river/i18n';
import { lt } from '../lt';

const names: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', prostir: 'ПРОСТІР' };

/** A card scheme's own name; the national scheme keeps its Ukrainian name in both languages. */
export function schemeText(scheme: string, locale: Locale): string {
  return names[scheme] ?? lt(locale)('another scheme', 'інша платіжна система');
}
