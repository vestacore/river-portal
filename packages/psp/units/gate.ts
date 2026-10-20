// @river/psp-units — the hierarchy of organisational units (adr/records/ADR-0026), as in a directory:
// a unit sees and steers its subtree; policies set on a unit apply below it, overridden, narrowed,
// enforced or blocked, and every unit's effective policy says where each value comes from.
export { unitKinds } from './types/Unit.ts';
export type { Unit, UnitKind } from './types/Unit.ts';
export type { UnitProfile } from './types/UnitProfile.ts';
export { policyGroups } from './types/Policy.ts';
export type { PolicyGroup, PolicyValue, PolicyCombine, PolicyDefinition, PolicySetting, PolicyStep, EffectivePolicy } from './types/Policy.ts';
export { policyDefinitions } from './data/policyDefinitions.ts';
export { unitKindLabels, policyGroupLabels } from './data/unitLabels.ts';
export { ancestorsOf } from './ancestorsOf.ts';
export { childrenOf } from './childrenOf.ts';
export { subtreeOf } from './subtreeOf.ts';
export { isWithin } from './isWithin.ts';
export { nearestOfKind } from './nearestOfKind.ts';
export { findPolicyDefinition } from './findPolicyDefinition.ts';
export { resolvePolicy } from './resolvePolicy.ts';
export { resolvePolicies } from './resolvePolicies.ts';
export { policyValue } from './policyValue.ts';
export { checkSetting } from './checkSetting.ts';
