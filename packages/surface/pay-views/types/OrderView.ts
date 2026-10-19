import type { Currency, Posting, ProviderName } from '@river/pay-facts';
import type { AttemptState } from '@river/pay-flow';
import type { OrderStatus } from './OrderStatus.ts';

/**
 * One order as its cabinets read it: a fold of the order's stream, written in the same transaction
 * as the facts it folds, and always rebuildable from them. `seq` is the last fact folded in.
 * `attempts` is folded by the very function the checkout gate uses, so the surface cannot say one
 * thing about an attempt while the figure holds another; `status` is read off the parts.
 * `sessionRef` repeats the open session's reference at the top, so a session can be looked up, and
 * `posted` says the order has an entry in the ledger.
 */
export type OrderView = {
  orderId: string;
  merchantId: string;
  payerRef: string;
  title: string;
  amountMinor: number;
  currency: Currency;
  payKeyHash: string;
  providers: ProviderName[];
  status: OrderStatus;
  placedAt: string;
  updatedAt: string;
  seq: number;
  invoice: { invoiceId: string; feeBps: number; feeMinor: number; netMinor: number; expiresAt: string } | null;
  attempts: AttemptState;
  refused: boolean;
  route: { provider: ProviderName; reason: string } | null;
  session: { provider: ProviderName; sessionRef: string; redirectUrl: string; simulated: boolean; openedAt: string } | null;
  sessionRef: string | null;
  lastFailure: { provider: ProviderName | null; reason: string; at: string } | null;
  captureSimulated: boolean | null;
  paid: { provider: ProviderName; providerRef: string; at: string; simulated: boolean } | null;
  receiptId: string | null;
  flag: { reason: string; providerRef: string; gotMinor: number; gotCurrency: string; at: string } | null;
  cancelled: { reason: string; by: string; at: string } | null;
  postings: Posting[];
  posted: boolean;
};
