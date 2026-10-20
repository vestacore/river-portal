import type { InvoiceStatus } from './types/InvoiceStatus.ts';
import type { InvoiceView } from './types/InvoiceView.ts';

/** The status of an invoice at `now`: voided and refunded first, then paid, then overdue by the clock. */
export function invoiceStatusAt(view: InvoiceView, now: string): InvoiceStatus {
  if (view.voided) return 'void';
  if (view.paidMinor > 0 && view.refundedMinor >= view.paidMinor) return 'refunded';
  if (view.paidMinor >= view.amountMinor) return view.refundedMinor > 0 ? 'partially_refunded' : 'paid';
  if (now > view.dueAt) return 'overdue';
  if (view.paidMinor > 0) return 'partially_paid';
  return view.viewedAt ? 'viewed' : 'issued';
}
