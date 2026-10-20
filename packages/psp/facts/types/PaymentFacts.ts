import type { Currency } from './Currency.ts';
import type { Allocation } from './Split.ts';

// Facts of the `payment` boundary — its life after the mouth (key: paymentId).

/** `refund.Requested` — the door, by an operator or the merchant's server: give money back. */
export type RefundRequested = {
  paymentId: string;
  refundId: string;
  amountMinor: number;
  currency: Currency;
  reason: string;
  by: string;
};

/**
 * `refund.Completed` — the world (the acquirer): the money went back. `allocations` say whose shares
 * gave it back (negative amounts); the PSP's fee is kept unless the tariff says otherwise.
 */
export type RefundCompleted = {
  paymentId: string;
  refundId: string;
  invoiceId: string;
  orderId: string;
  acquirer: string;
  amountMinor: number;
  currency: Currency;
  allocations: Allocation[];
};

/** `refund.Failed` — the world: the acquirer could not return the money (a closed card, an expired account). */
export type RefundFailed = {
  paymentId: string;
  refundId: string;
  reason: string;
};

/** `dispute.Opened` — the world (a card scheme): the payer's bank disputes the payment; the amount is held from the merchant. */
export type DisputeOpened = {
  paymentId: string;
  disputeId: string;
  orderId: string;
  amountMinor: number;
  currency: Currency;
  reason: 'fraud' | 'not_received' | 'not_as_described' | 'duplicate' | 'cancelled_subscription';
  respondBy: string;
};

/** `dispute.Evidenced` — the door, by an operator: evidence went to the scheme. */
export type DisputeEvidenced = {
  paymentId: string;
  disputeId: string;
  documents: number;
  by: string;
};

/** `dispute.Won` — the world: the scheme decided for the merchant; the hold is released. */
export type DisputeWon = {
  paymentId: string;
  disputeId: string;
  orderId: string;
};

/** `dispute.Lost` — the world: the scheme decided for the payer; the amount goes back, from these shares. */
export type DisputeLost = {
  paymentId: string;
  disputeId: string;
  invoiceId: string;
  orderId: string;
  acquirer: string;
  amountMinor: number;
  currency: Currency;
  allocations: Allocation[];
};

/** `payout.Sent` — the world (a bank): one recipient's share left for its account in a payout batch. */
export type PayoutSent = {
  paymentId: string;
  batchId: string;
  acquirer: string;
  rule: number;
  recipientUnitId: string;
  amountMinor: number;
  currency: Currency;
};
