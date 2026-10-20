import type { InvoiceView } from './types/InvoiceView.ts';

const day = 86_400_000;

/**
 * The reminder steps that are due at `now` and were not sent: `offsets` are days relative to the due
 * date (−3 = three days before, 7 = a week after). Nothing is due on a paid or voided invoice.
 */
export function remindersDue(view: InvoiceView, offsets: readonly number[], now: string): number[] {
  if (view.voided || view.paidMinor >= view.amountMinor) return [];
  const due = Date.parse(view.dueAt);
  const sent = new Set(view.reminders.map((r) => r.step));
  return offsets.map((offset, step) => ({ offset, step })).filter(({ offset, step }) => !sent.has(step) && Date.parse(now) >= due + offset * day).map(({ step }) => step);
}
