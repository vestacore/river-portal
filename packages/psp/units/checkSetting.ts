import { ancestorsOf } from './ancestorsOf.ts';
import { findPolicyDefinition } from './findPolicyDefinition.ts';
import { resolvePolicy } from './resolvePolicy.ts';
import type { PolicySetting } from './types/Policy.ts';
import type { Unit } from './types/Unit.ts';

/**
 * Why a setting would not take effect where it is proposed, or an empty list: a unit above enforces the
 * policy, or the value is looser than what the units above allow (a higher limit, an instrument the
 * parent does not allow). The resolution itself would ignore such a setting; this says so before it is saved.
 */
export function checkSetting(units: readonly Unit[], settings: readonly PolicySetting[], proposed: PolicySetting): string[] {
  const definition = findPolicyDefinition(proposed.key);
  const path = ancestorsOf(units, proposed.unitId);
  const parent = path.length > 1 ? path[path.length - 2] : undefined;
  if (!parent) return [];
  const others = settings.filter((s) => !(s.unitId === proposed.unitId && s.key === proposed.key));
  const above = resolvePolicy(units, others, parent.id, definition);
  if (above.enforcedBy) return [`enforced:${above.enforcedBy}`];
  const after = resolvePolicy(units, [...others, proposed], proposed.unitId, definition);
  const own = after.chain.find((step) => step.unitId === proposed.unitId);
  return own && own.outcome === 'looser' ? [`looser:${above.source ?? 'default'}`] : [];
}
