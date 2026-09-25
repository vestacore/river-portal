/** Demo personas, one per role on the river (spec: Audiences and Personas). */
export const personaIds = ['olena', 'james', 'harbour', 'mykola', 'andriy', 'helen', 'sofia', 'iryna', 'priya'] as const;
export type PersonaId = (typeof personaIds)[number];
