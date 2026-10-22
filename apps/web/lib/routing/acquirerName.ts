import { pickText, type Locale } from '@river/i18n';
import { acquirers } from '@river/psp-instruments';

/** A provider's name in the reader's language — an acquirer, a hub, a lender — from its id or a split recipient `acq:<id>`. */
export function acquirerName(id: string, locale: Locale): string {
  const key = id.startsWith('acq:') ? id.slice(4) : id;
  return pickText(acquirers.find((a) => a.id === key)?.label, locale) || key;
}
