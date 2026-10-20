import { policyDefinitions } from './data/policyDefinitions.ts';
import { resolvePolicy } from './resolvePolicy.ts';
import type { EffectivePolicy, PolicySetting } from './types/Policy.ts';
import type { Unit } from './types/Unit.ts';

/** Every declared policy of a unit, resolved: the unit's resultant set of policy. */
export function resolvePolicies(units: readonly Unit[], settings: readonly PolicySetting[], unitId: string): EffectivePolicy[] {
  return policyDefinitions.map((definition) => resolvePolicy(units, settings, unitId, definition));
}
