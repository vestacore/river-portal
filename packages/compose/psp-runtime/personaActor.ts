import { scopesOf } from '@river/psp-access';
import type { Actor, World } from './types/World.ts';

/** The actor a person is in one of their profiles — the one asked for, or their first. Null for nobody. */
export function personaActor(world: World, personId: string, grantId: string | null, at: string): Extract<Actor, { kind: 'person' }> | null {
  const scopes = scopesOf(world.grants, personId, at);
  const grant = scopes.find((g) => g.id === grantId) ?? scopes[0];
  return grant ? { kind: 'person', personId, grantId: grant.id, role: grant.role, unitId: grant.unitId } : null;
}
