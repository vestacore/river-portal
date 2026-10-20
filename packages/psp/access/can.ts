import { isWithin, type Unit } from '@river/psp-units';
import { rolePermissions } from './data/rolePermissions.ts';
import type { Grant, Permission } from './types/Access.ts';

/**
 * Whether a person may do something at a unit: some active grant of theirs, at the unit or above it,
 * carries a role with that permission. A grant reaches down its unit's subtree and never up or sideways.
 */
export function can(units: readonly Unit[], grants: readonly Grant[], personId: string, permission: Permission, unitId: string, now: string): boolean {
  return grants.some((g) => g.personId === personId && g.status === 'active' && (g.expiresAt === null || g.expiresAt > now)
    && rolePermissions[g.role].includes(permission) && isWithin(units, unitId, g.unitId));
}
