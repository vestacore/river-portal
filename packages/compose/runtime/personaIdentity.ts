import type { Identity } from '@river/identity';
import type { Locale } from '@river/i18n';
import type { ProfileId } from '@river/settings';
import { findPersona } from './findPersona.ts';
import { personaName } from './personaName.ts';

/** The identity of a demo persona (via 'demo'), or null for unknown personas. */
export function personaIdentity(personaId: string | undefined, profileId: ProfileId, locale: Locale): Identity | null {
  const persona = findPersona(personaId);
  if (!persona) return null;
  return { personId: persona.personId, name: personaName(persona.id, profileId, locale), roles: [...persona.roles], via: 'demo', personaId: persona.id };
}
