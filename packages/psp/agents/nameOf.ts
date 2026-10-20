import type { LocalisedText } from '@river/i18n';
import type { Unit } from '@river/psp-units';

/** A unit's name in both languages, or its id when the unit is unknown. */
export function nameOf(units: readonly Unit[], unitId: string): LocalisedText {
  return units.find((u) => u.id === unitId)?.name ?? { 'en-GB': unitId, uk: unitId };
}
