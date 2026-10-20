import type { SplitPlan, SplitRule } from '@river/psp-facts';
import type { PlanContext, SplitTemplateId } from './types/SplitTemplate.ts';

/**
 * A split plan for one order from a unit's template. Sellers' and suppliers' lines go to them less the
 * commission; a franchisor takes its royalty; a good cause takes its share; the PSP takes its fee; the
 * merchant takes the remainder. Holds apply to every share the PSP does not keep.
 */
export function planFromTemplate(template: SplitTemplateId, ctx: PlanContext): SplitPlan {
  const hold = ctx.holdDays > 0 ? { holdDays: ctx.holdDays } : {};
  const rules: SplitRule[] = [];
  if (template === 'marketplace' || template === 'agency') {
    for (const seller of ctx.sellerUnitIds) rules.push({ recipientUnitId: seller, role: 'seller', basis: 'lines', sellerUnitId: seller, bps: 10_000 - ctx.commissionBps, ...hold });
  }
  if (template === 'franchise' && ctx.franchisorUnitId && ctx.royaltyBps > 0) rules.push({ recipientUnitId: ctx.franchisorUnitId, role: 'partner', basis: 'percent', bps: ctx.royaltyBps, ...hold });
  if (ctx.charityUnitId && ctx.charityBps > 0) rules.push({ recipientUnitId: ctx.charityUnitId, role: 'charity', basis: 'percent', bps: ctx.charityBps });
  rules.push({ recipientUnitId: ctx.pspUnitId, role: 'psp_fee', basis: 'fee' });
  rules.push({ recipientUnitId: ctx.merchantUnitId, role: template === 'marketplace' ? 'platform' : 'merchant', basis: 'remainder', ...hold });
  return { templateId: template, rules };
}
