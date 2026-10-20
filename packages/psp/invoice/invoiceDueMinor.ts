import type { InvoiceView } from './types/InvoiceView.ts';

/** What is still to be paid on an invoice. A refund gives money back; it does not make the claim due again. */
export function invoiceDueMinor(view: InvoiceView): number {
  if (view.voided) return 0;
  return Math.max(0, view.amountMinor - view.paidMinor);
}
