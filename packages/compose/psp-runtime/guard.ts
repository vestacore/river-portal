import { can, type Permission } from '@river/psp-access';
import type { Actor, World } from './types/World.ts';

/**
 * Why an actor may not do something at a unit, or null when they may. The profile they act in counts:
 * its grant must be theirs, active, and carry the permission at that unit or above it.
 */
export function guard(world: World, actor: Actor, permission: Permission, unitId: string, at: string): string | null {
  if (actor.kind !== 'person') return 'a cabinet action needs a person';
  const grant = world.grants.find((g) => g.id === actor.grantId && g.personId === actor.personId && g.status === 'active');
  if (!grant) return 'this profile is not active';
  return can(world.units, [grant], actor.personId, permission, unitId, at) ? null : `no ${permission} at ${unitId} in this profile`;
}
