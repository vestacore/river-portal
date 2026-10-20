import { isWithin, type Unit } from '@river/psp-units';
import type { Grant, PspRole } from './types/Access.ts';

// Pairs of roles one person may not hold over the same flows: who moves money does not clear its checks.
const separated: ReadonlyArray<readonly [PspRole, PspRole]> = [['operator', 'compliance_officer'], ['access_manager', 'compliance_officer'], ['integrator', 'compliance_officer']];

/**
 * Why a proposed grant breaks the separation of duties, or an empty list: the person already holds a
 * separated role over an overlapping part of the hierarchy (one unit within the other's subtree).
 */
export function dutyConflicts(units: readonly Unit[], grants: readonly Grant[], proposed: Pick<Grant, 'personId' | 'role' | 'unitId'>): string[] {
  const held = grants.filter((g) => g.personId === proposed.personId && g.status === 'active');
  return held.filter((g) => separated.some(([a, b]) => (a === g.role && b === proposed.role) || (b === g.role && a === proposed.role))
    && (isWithin(units, g.unitId, proposed.unitId) || isWithin(units, proposed.unitId, g.unitId))).map((g) => `${g.role}@${g.unitId}`);
}
