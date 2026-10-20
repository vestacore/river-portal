import { effectiveRules, matchRule, scoreAttempt, type RiskRule, type RiskSignals } from '@river/psp-risk';
import { policyValue, type EffectivePolicy, type Unit } from '@river/psp-units';
import type { Screening } from './types/Screening.ts';

const rank = { pass: 0, review: 1, block: 2 } as const;

/**
 * The screening bridge of an attempt: the deterministic score under the unit's thresholds, then every
 * rule set on the unit and above it. A rule can only make the decision stricter — block, hold for review —
 * or name a route or a notification; it never lets through what the score held.
 */
export function screenAttempt(input: { units: readonly Unit[]; rules: readonly RiskRule[]; unitId: string; signals: RiskSignals; effective: readonly EffectivePolicy[] }): Screening {
  const reviewAt = Number(policyValue(input.effective, 'risk.review.score') ?? 75);
  const blockAt = Number(policyValue(input.effective, 'risk.block.score') ?? 92);
  const scored = scoreAttempt(input.signals, reviewAt, blockAt);
  const ctx = { ...input.signals, score: scored.score };
  const matched = effectiveRules(input.units, input.rules, input.unitId).filter((rule) => matchRule(rule, ctx));
  let decision = scored.decision;
  for (const rule of matched) {
    const wanted = rule.action === 'block' ? 'block' : rule.action === 'review' ? 'review' : 'pass';
    if (rank[wanted] > rank[decision]) decision = wanted;
  }
  const reasons = matched.some((r) => r.action === 'block' || r.action === 'review') && !scored.reasons.includes('rule') ? [...scored.reasons, 'rule' as const] : scored.reasons;
  return { ...scored, reasons, decision, matched, routeTo: matched.find((r) => r.action === 'route')?.target ?? null, notify: matched.some((r) => r.action === 'notify') };
}
