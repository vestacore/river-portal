import { effectiveFor, type World } from '@river/psp-runtime';
import { findPolicyDefinition, policyValue } from '@river/psp-units';

/**
 * The lowest approval threshold a unit can set and have it take effect. The threshold may only be
 * raised down the hierarchy, and resolution starts from the declared default, so the floor is what applies
 * from the unit above — or, at the top, the default itself. A lower setting is kept but ignored.
 */
export function thresholdFloor(w: World, unitId: string): number {
  const key = 'routing.minApproval.bps';
  const parentId = w.units.find((u) => u.id === unitId)?.parentId ?? null;
  const above = parentId ? policyValue(effectiveFor(w, parentId), key) : findPolicyDefinition(key).default;
  return typeof above === 'number' ? above : 0;
}
