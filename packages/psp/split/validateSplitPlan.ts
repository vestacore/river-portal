import type { SplitPlan } from '@river/psp-facts';

/**
 * What is wrong with a split plan, or an empty list: exactly one rule takes the remainder (so the
 * money always sums to the amount), at most one takes the PSP's fee, shares are 0–100 %, a `lines`
 * rule names its seller, and fixed amounts are whole minor units.
 */
export function validateSplitPlan(plan: SplitPlan): string[] {
  const errors: string[] = [];
  const remainders = plan.rules.filter((r) => r.basis === 'remainder').length;
  if (remainders !== 1) errors.push(`exactly one rule takes the remainder (found ${remainders})`);
  if (plan.rules.filter((r) => r.basis === 'fee').length > 1) errors.push('at most one rule takes the PSP fee');
  plan.rules.forEach((rule, i) => {
    if ((rule.basis === 'percent' || rule.basis === 'lines') && (!Number.isInteger(rule.bps) || (rule.bps ?? -1) < 0 || (rule.bps ?? 0) > 10_000)) errors.push(`rules[${i}].bps: 0–10000`);
    if (rule.basis === 'lines' && !rule.sellerUnitId) errors.push(`rules[${i}].sellerUnitId: a lines rule names its seller`);
    if (rule.basis === 'fixed' && (!Number.isInteger(rule.fixedMinor) || (rule.fixedMinor ?? -1) < 0)) errors.push(`rules[${i}].fixedMinor: a whole number of minor units`);
    if (!rule.recipientUnitId) errors.push(`rules[${i}].recipientUnitId: required`);
  });
  return errors;
}
