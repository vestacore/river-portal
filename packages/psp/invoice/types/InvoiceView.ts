import type { Currency } from '@river/psp-facts';

/**
 * The invoice as the cabinets read it: its own facts plus the sessions that tried to pay it, the
 * captures that paid it, the receipts it produced, and the refunds and lost disputes that gave money back.
 */
export type InvoiceView = {
  invoiceId: string;
  orderId: string;
  unitId: string;
  merchantId: string;
  number: string;
  issuedAt: string;
  updatedAt: string;
  dueAt: string;
  amountMinor: number;
  currency: Currency;
  allowPartial: boolean;
  payKeyHash: string;
  paidMinor: number;
  refundedMinor: number;
  sent: Array<{ at: string; channel: string }>;
  viewedAt: string | null;
  views: number;
  reminders: Array<{ at: string; step: number; channel: string; decidedBy: string }>;
  sessionIds: string[];
  attempts: { opened: number; succeeded: number; failed: number; abandoned: number; expired: number };
  receiptIds: string[];
  voided: { at: string; reason: string; by: string } | null;
};
