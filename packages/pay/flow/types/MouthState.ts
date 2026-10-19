import type { InvoiceIssued, PaymentCaptured } from '@river/pay-facts';

/** What the mouth holds: the invoice, the sessions that were opened, and the first capture to arrive. */
export type MouthState = {
  invoice: InvoiceIssued | null;
  sessions: string[];
  capture: PaymentCaptured | null;
  cancelled: boolean;
};
