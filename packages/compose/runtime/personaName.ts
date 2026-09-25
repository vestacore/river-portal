import type { Locale } from '@river/i18n';
import type { ProfileId } from '@river/settings';
import { demoVariants } from './data/demoVariants.ts';
import type { PersonaId } from './types/PersonaId.ts';

/** A persona's display name in the given profile's demo data. */
export function personaName(personaId: PersonaId, profileId: ProfileId, locale: Locale): string {
  return demoVariants[profileId].personaNames[personaId][locale];
}
