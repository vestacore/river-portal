import { ancestorsOf } from './ancestorsOf.ts';
import type { EffectivePolicy, PolicyDefinition, PolicySetting, PolicyStep, PolicyValue } from './types/Policy.ts';
import type { Unit } from './types/Unit.ts';

const asList = (value: PolicyValue): string[] => (Array.isArray(value) ? value.map(String) : []);

/** Meets one setting with the value resolved above it, by the policy's rule. */
function meet(definition: PolicyDefinition, above: PolicyValue, aboveIsDefault: boolean, value: PolicyValue): { value: PolicyValue; outcome: PolicyStep['outcome'] } {
  switch (definition.combine) {
    case 'override': return { value, outcome: 'applied' };
    case 'min':
    case 'max': {
      if (typeof value !== 'number') return { value: above, outcome: 'looser' };
      if (above === null || aboveIsDefault && typeof above !== 'number') return { value, outcome: 'applied' };
      if (typeof above !== 'number') return { value, outcome: 'applied' };
      const tighter = definition.combine === 'min' ? value <= above : value >= above;
      return tighter ? { value, outcome: aboveIsDefault ? 'applied' : 'narrowed' } : { value: above, outcome: 'looser' };
    }
    case 'subset': {
      const allowed = new Set(asList(above));
      const kept = asList(value).filter((item) => allowed.has(item));
      return { value: kept, outcome: kept.length < asList(value).length ? 'looser' : aboveIsDefault ? 'applied' : 'narrowed' };
    }
    case 'union': return { value: [...new Set([...asList(above), ...asList(value)])], outcome: 'applied' };
  }
}

/**
 * The effective policy of a unit — its resultant set of policy — resolved from the root down, as in a
 * directory: the declared default, then each unit's setting on the path, met by the policy's rule
 * (`override`, `min`, `max`, `subset`, `union`). A setting `enforced` higher up fixes the value: nothing
 * below it counts. A unit that blocks inheritance starts afresh from the default, keeping only what was
 * enforced above it. Each step of the chain says what happened to its setting, so a person can see why.
 */
export function resolvePolicy(units: readonly Unit[], settings: readonly PolicySetting[], unitId: string, definition: PolicyDefinition): EffectivePolicy {
  const path = ancestorsOf(units, unitId);
  const cut = path.reduce((deepest, unit, i) => (unit.blockInheritance ? i : deepest), 0);
  let value: PolicyValue = definition.default;
  let isDefault = true;
  let source: string | null = null;
  let enforcedBy: string | null = null;
  const chain: PolicyStep[] = [];
  path.forEach((unit, i) => {
    const setting = settings.find((s) => s.unitId === unit.id && s.key === definition.key);
    if (!setting) return;
    const step = { unitId: unit.id, value: setting.value, mode: setting.mode };
    if (enforcedBy) { chain.push({ ...step, outcome: 'below_enforced' }); return; }
    if (i < cut && setting.mode !== 'enforced') { chain.push({ ...step, outcome: 'blocked' }); return; }
    const met = meet(definition, value, isDefault, setting.value);
    chain.push({ ...step, outcome: met.outcome });
    if (met.outcome !== 'looser' || definition.combine === 'subset') {
      value = met.value;
      isDefault = false;
      source = unit.id;
    }
    if (setting.mode === 'enforced') enforcedBy = unit.id;
  });
  return { key: definition.key, value, source, enforcedBy, chain };
}
