import type { PaymentView } from './types/PaymentView.ts';

/** How much of a payment may still be refunded: captured, less what went back or is on its way back or under dispute. */
export function refundableMinor(view: PaymentView): number {
  const pending = view.refunds.filter((r) => r.status === 'requested').reduce((s, r) => s + r.amountMinor, 0);
  const disputed = view.disputes.filter((d) => d.status === 'open' || d.status === 'evidenced').reduce((s, d) => s + d.amountMinor, 0);
  return Math.max(0, view.capturedMinor - view.refundedMinor - view.chargebackMinor - pending - disputed);
}
