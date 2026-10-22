import { pickText, type Locale } from '@river/i18n';
import { issuers } from '@river/psp-instruments';

/** The bank behind an acquiring arm — the bank whose own cards are on-us there — or null for a provider no issuing bank stands behind. */
export function bankName(acquirerId: string, locale: Locale): string | null {
  const bank = issuers.find((i) => i.acquirerIds.includes(acquirerId));
  return bank ? pickText(bank.name, locale) : null;
}
