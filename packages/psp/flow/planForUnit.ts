import type { OrderLine, SplitPlan } from '@river/psp-facts';
import { planFromTemplate, type SplitTemplateId } from '@river/psp-split';
import { policyValue, type EffectivePolicy } from '@river/psp-units';

/**
 * The split plan of a new order, from the effective policies of the unit that sells: its template, the
 * marketplace commission, the share for a good cause and its recipient, the hold; the sellers are those
 * whose lines the order carries.
 */
export function planForUnit(input: { merchantUnitId: string; pspUnitId: string; lines: readonly OrderLine[]; effective: readonly EffectivePolicy[]; franchisorUnitId: string | null }): SplitPlan {
  const template = String(policyValue(input.effective, 'split.template') ?? 'direct') as SplitTemplateId;
  const sellers = [...new Set(input.lines.map((l) => l.sellerUnitId).filter((s): s is string => s !== null))];
  const charityBps = Number(policyValue(input.effective, 'split.charity.bps') ?? 0);
  const charity = String(policyValue(input.effective, 'split.charity.recipient') ?? '');
  return planFromTemplate(template, {
    merchantUnitId: input.merchantUnitId,
    pspUnitId: input.pspUnitId,
    sellerUnitIds: template === 'marketplace' || template === 'agency' ? sellers : [],
    commissionBps: Number(policyValue(input.effective, 'split.commission.bps') ?? 0),
    charityBps: charity && charity !== input.merchantUnitId ? charityBps : 0,
    charityUnitId: charity && charity !== input.merchantUnitId ? charity : null,
    franchisorUnitId: input.franchisorUnitId,
    royaltyBps: template === 'franchise' ? 600 : 0,
    holdDays: Number(policyValue(input.effective, 'settlement.hold.days') ?? 0),
  });
}
