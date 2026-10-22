import { pickText, type Locale } from '@river/i18n';
import { acquirers } from '@river/psp-instruments';
import type { StandId } from '@river/psp-runtime';
import { lt } from '@/lib/lt';

/**
 * A provider's name as the reader's language writes it — or its id, for a provider the demo does not know.
 * On the retail stand the bonus system is the group's own, and is called so.
 */
export function providerName(id: string, locale: Locale, stand?: StandId): string {
  if (stand === 'retail' && id === 'bonus-system') return lt(locale)('The group’s bonus system', 'Бонусна система групи');
  const provider = acquirers.find((a) => a.id === id);
  return provider ? pickText(provider.label, locale) : id;
}
