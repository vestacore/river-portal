import { ancestorsOf, type Unit } from '@river/psp-units';
import type { RiskRule } from './types/Risk.ts';

/**
 * The rules that apply to a unit's attempts: every enabled rule set on the unit or above it, by priority
 * (lower first), the higher unit first where priorities tie. An enforced rule applies even where a lower
 * unit tried to switch it off with a disabled copy of the same id.
 */
export function effectiveRules(units: readonly Unit[], rules: readonly RiskRule[], unitId: string): RiskRule[] {
  const path = ancestorsOf(units, unitId).map((u) => u.id);
  const onPath = rules.filter((r) => path.includes(r.unitId));
  const switchedOff = new Set(onPath.filter((r) => !r.enabled).map((r) => r.id));
  return onPath
    .filter((r) => r.enabled && (r.enforced || !switchedOff.has(r.id)))
    .sort((a, b) => a.priority - b.priority || path.indexOf(a.unitId) - path.indexOf(b.unitId));
}
