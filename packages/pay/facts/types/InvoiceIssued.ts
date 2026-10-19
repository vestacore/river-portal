import type { Currency } from './Currency.ts';

/** `invoice.Issued` — a figure: the payable claim of an order, with the platform's commission stated. */
export type InvoiceIssued = {
  invoiceId: string;
  amountMinor: number;
  currency: Currency;
  feeBps: number;
  feeMinor: number;
  netMinor: number;
  expiresAt: string;
};
