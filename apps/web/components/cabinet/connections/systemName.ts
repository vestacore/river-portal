import { pickText, type Locale } from '@river/i18n';
import { lt } from '@/lib/lt';
import type { ConnectedSystem } from './systemsOf';

/** What a connected system is called: the group's name for it, the unit that holds it, or the rest. */
export function systemName(system: ConnectedSystem, locale: Locale, unitName: (id: string) => string): string {
  if (system.definition) return pickText(system.definition.name, locale);
  if (system.unitId) return unitName(system.unitId);
  return lt(locale)('Other keys and endpoints', 'Інші ключі й кінцеві точки');
}
