import type { Allocation } from '@river/psp-facts';
import type { PaymentView } from './types/PaymentView.ts';

/**
 * The shares of a captured payment that may be paid out at `now`: their hold has passed and no payout
 * has carried them yet. The PSP's own fee is not paid out; it stays in its revenue account. A share is
 * known by its recipient and its rule, so a merchant's share and its reserve are paid out separately.
 */
export function payoutsDue(view: PaymentView, now: string): Allocation[] {
  if (view.capturedMinor === 0 || view.status === 'disputed' || view.status === 'refunded' || view.status === 'chargeback') return [];
  const paid = new Set(view.payouts.map((p) => `${p.recipientUnitId}:${p.rule}`));
  return view.allocations.filter((a) => a.role !== 'psp_fee' && a.amountMinor > 0 && !paid.has(`${a.recipientUnitId}:${a.rule}`) && (a.holdUntil === null || a.holdUntil <= now));
}
