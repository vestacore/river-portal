/** Where an invoice stands at a moment. `overdue` depends on the clock, so it is read, never stored. */
export const invoiceStatuses = ['issued', 'viewed', 'partially_paid', 'paid', 'partially_refunded', 'refunded', 'overdue', 'void'] as const;
export type InvoiceStatus = (typeof invoiceStatuses)[number];
