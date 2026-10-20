import type { Allocation } from '@river/psp-facts';
import type { AllocationInput } from './types/SplitTemplate.ts';
import { validateSplitPlan } from './validateSplitPlan.ts';

const day = 86_400_000;

/**
 * The delta of one capture: who receives how much. Every share is rounded down in integer minor units;
 * the remainder rule takes what is left, so the shares always sum exactly to the captured amount — water
 * is neither made nor lost. A partial capture scales the sellers' lines in proportion. A plan that would
 * give away more than there is fails rather than inventing money. A rolling reserve is carved out of the
 * remainder as its own stream (rule −1), held for `reserveDays`.
 */
export function allocate(input: AllocationInput): Allocation[] {
  const errors = validateSplitPlan(input.plan);
  if (errors.length > 0) throw new Error(`Split plan: ${errors.join('; ')}`);
  if (!Number.isInteger(input.amountMinor) || input.amountMinor < 0) throw new Error('The amount must be whole minor units');
  const holdUntil = (days: number | undefined) => (days && days > 0 ? new Date(Date.parse(input.at) + days * day).toISOString() : null);
  const shares = input.plan.rules.map((rule, index) => {
    let amount = 0;
    switch (rule.basis) {
      case 'fee': amount = input.feeMinor; break;
      case 'percent': amount = Math.floor((input.amountMinor * (rule.bps ?? 0)) / 10_000); break;
      case 'fixed': amount = rule.fixedMinor ?? 0; break;
      case 'lines': {
        const sold = input.lines.filter((line) => line.sellerUnitId === rule.sellerUnitId).reduce((s, line) => s + line.totalMinor, 0);
        const scaled = input.orderTotalMinor > 0 ? Math.floor((sold * input.amountMinor) / input.orderTotalMinor) : 0;
        amount = Math.floor((scaled * (rule.bps ?? 10_000)) / 10_000);
        break;
      }
      case 'remainder': amount = 0; break;
    }
    return { rule, index, amount };
  });
  const given = shares.reduce((s, x) => s + x.amount, 0);
  const left = input.amountMinor - given;
  if (left < 0) throw new Error(`The plan gives away ${given} of ${input.amountMinor}`);
  const out: Allocation[] = shares.map(({ rule, index, amount }) => ({
    recipientUnitId: rule.recipientUnitId,
    role: rule.role,
    amountMinor: rule.basis === 'remainder' ? left : amount,
    currency: input.currency,
    rule: index,
    holdUntil: holdUntil(rule.holdDays),
  }));
  const reserveBps = input.reserveBps ?? 0;
  const owner = out.find((a) => input.plan.rules[a.rule]?.basis === 'remainder');
  if (reserveBps > 0 && owner && owner.amountMinor > 0) {
    const kept = Math.floor((owner.amountMinor * reserveBps) / 10_000);
    if (kept > 0) {
      owner.amountMinor -= kept;
      out.push({ recipientUnitId: owner.recipientUnitId, role: 'reserve', amountMinor: kept, currency: input.currency, rule: -1, holdUntil: holdUntil(input.reserveDays ?? 90) });
    }
  }
  return out;
}
