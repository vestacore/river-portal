import type { LocalisedText } from '@river/i18n';
import { roleLabels, type PspRole } from '@river/psp-access';
import type { World } from './types/World.ts';

/** How the audit trail names a grant, in both languages: the role, the person, the unit. */
export function grantText(world: World, personId: string, role: PspRole, unitId: string): LocalisedText {
  const person = world.people.find((p) => p.id === personId)?.name;
  const unit = world.units.find((u) => u.id === unitId)?.name;
  return {
    'en-GB': `${roleLabels[role]['en-GB']}: ${person?.['en-GB'] ?? personId} · ${unit?.['en-GB'] ?? unitId}`,
    uk: `${roleLabels[role].uk}: ${person?.uk ?? personId} · ${unit?.uk ?? unitId}`,
  };
}
