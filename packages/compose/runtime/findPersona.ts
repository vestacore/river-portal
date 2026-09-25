import { personas } from './data/personas.ts';
import type { Persona } from './types/Persona.ts';

/** The demo persona with this id, or undefined. */
export function findPersona(id: string | undefined): Persona | undefined {
  return personas.find((p) => p.id === id);
}
