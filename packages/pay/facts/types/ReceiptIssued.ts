import type { Currency } from './Currency.ts';

/** `receipt.Issued` — a figure: what the payer receives back. */
export type ReceiptIssued = {
  receiptId: string;
  payerRef: string;
  amountMinor: number;
  currency: Currency;
};
