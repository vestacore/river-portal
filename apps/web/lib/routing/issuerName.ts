import { pickText, type Locale } from '@river/i18n';
import { issuers } from '@river/psp-instruments';
import { lt } from '../lt';

/** The issuing bank of a card by its id, or a plain phrase when the card's range belongs to no bank the directory knows. */
export function issuerName(issuerId: string | null | undefined, locale: Locale, domestic = true): string {
  const t = lt(locale);
  const bank = issuerId ? issuers.find((i) => i.id === issuerId) : undefined;
  if (bank) return pickText(bank.name, locale);
  return domestic ? t('a bank the directory does not know', 'банк, якого немає в довіднику') : t('a foreign bank', 'іноземний банк');
}
