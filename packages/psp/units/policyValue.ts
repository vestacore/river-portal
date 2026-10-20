import type { EffectivePolicy, PolicyValue } from './types/Policy.ts';

/** The effective value of one policy among a unit's resolved policies (null when the key is not there). */
export function policyValue(effective: readonly EffectivePolicy[], key: string): PolicyValue {
  return effective.find((p) => p.key === key)?.value ?? null;
}
