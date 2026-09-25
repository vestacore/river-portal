import { personas } from './data/personas.ts';
import type { Persona } from './types/Persona.ts';

/** All demo personas, in river order: left bank, right bank, channel, stewards. */
export function listPersonas(): readonly Persona[] {
  return personas;
}
