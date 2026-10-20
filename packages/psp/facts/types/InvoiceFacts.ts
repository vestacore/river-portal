import type { Currency } from './Currency.ts';

// Facts of the `invoice` boundary. Only the invoice's own stream holds them (key: invoiceId).

/**
 * `invoice.Issued` — the door or the figure: the payable claim of an order. `payKeyHash` is the hash
 * of the key the payer pays with (the key itself is shown once). `allowPartial` lets several sessions
 * pay it in parts.
 */
export type InvoiceIssued = {
  invoiceId: string;
  orderId: string;
  unitId: string;
  merchantId: string;
  number: string;
  amountMinor: number;
  currency: Currency;
  dueAt: string;
  allowPartial: boolean;
  payKeyHash: string;
};

/** `invoice.Sent` — the figure: the pay link went out. Only the channel is recorded, never an address. */
export type InvoiceSent = {
  invoiceId: string;
  channel: 'email' | 'sms' | 'messenger' | 'link' | 'qr';
};

/** `invoice.Viewed` — the door, by the payer: the pay page was opened. */
export type InvoiceViewed = {
  invoiceId: string;
};

/** `invoice.Reminded` — the figure: a reminder went out, by policy or on a person's decision about an agent's proposal. */
export type InvoiceReminded = {
  invoiceId: string;
  step: number;
  channel: 'email' | 'sms' | 'messenger';
  decidedBy: string;
};

/** `invoice.Voided` — the door: the claim is withdrawn; nobody may pay it any more. */
export type InvoiceVoided = {
  invoiceId: string;
  orderId: string;
  reason: string;
  by: string;
};
