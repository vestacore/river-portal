import type { LocalisedText } from '@river/i18n';

export const policyGroups = ['limits', 'instruments', 'risk', 'capture', 'settlement', 'split', 'checkout', 'invoices', 'agents'] as const;
export type PolicyGroup = (typeof policyGroups)[number];

export type PolicyValue = number | string | boolean | string[] | number[] | null;

/**
 * How a lower unit's setting meets the ones above it:
 * - `override`: the lowest setting wins;
 * - `min` / `max`: a lower unit may only go lower (a limit) or higher (a reserve) — never looser;
 * - `subset`: a lower unit may only take items away (allowed instruments);
 * - `union`: a lower unit may only add items (blocked countries).
 */
export type PolicyCombine = 'override' | 'min' | 'max' | 'subset' | 'union';

/** The declared form of one policy: its key, kind, how settings combine, and its default. */
export type PolicyDefinition = {
  key: string;
  group: PolicyGroup;
  kind: 'number' | 'money' | 'percent' | 'boolean' | 'enum' | 'list' | 'text' | 'colour';
  combine: PolicyCombine;
  default: PolicyValue;
  options?: readonly string[];
  measure?: 'days' | 'minutes' | 'score' | 'bps';
  label: LocalisedText;
  help: LocalisedText;
};

/**
 * A policy set on a unit. `enforced` (as in a directory) means no unit below may change it, and a
 * block of inheritance does not stop it.
 */
export type PolicySetting = {
  unitId: string;
  key: string;
  value: PolicyValue;
  mode: 'default' | 'enforced';
  setBy: string;
  setAt: string;
  note?: string;
};

/** One unit's part in the resolution of a policy, from the top down. */
export type PolicyStep = {
  unitId: string;
  value: PolicyValue;
  mode: 'default' | 'enforced';
  outcome: 'applied' | 'narrowed' | 'looser' | 'below_enforced' | 'blocked';
};

/** The effective policy of a unit (a resultant set of policy): its value, where it comes from, and the chain. */
export type EffectivePolicy = {
  key: string;
  value: PolicyValue;
  source: string | null;
  enforcedBy: string | null;
  chain: PolicyStep[];
};
