import type { Role } from '@river/identity';
import type { LocalisedText } from '@river/i18n';
import type { PersonaId } from './PersonaId.ts';

/** A demo persona: who they are on the river, what they may do, and where they start. */
export type Persona = {
  id: PersonaId;
  personId: string;
  roles: Role[];
  bank: 'left' | 'right' | 'channel' | 'stewards';
  description: LocalisedText;
  home: string;
};
