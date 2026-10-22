import type { Currency } from './Currency.ts';

// Facts of the `settlement` boundary: what the other parties to the money report about one day's batch —
// the provider that settles it (an acquirer, an account-to-account hub, the merchant's bonus system), the
// merchant's own record of the sales, and the bank that credits the account. One stream per batch (key: batchId).

/** One line of a provider's breakdown: the cards of one issuer and one product within a batch. */
export type SettlementLine = {
  issuer: string | null;
  scheme: string;
  product: 'debit' | 'credit' | 'premium' | 'commercial' | 'other';
  onUs: boolean;
  count: number;
  grossMinor: number;
  feeMinor: number;
};

/** `sales.Reported` — the world (the merchant's tills or order system): card sales of a day, as the merchant recorded them. */
export type SalesReported = {
  batchId: string;
  source: 'pos' | 'oms' | 'loyalty';
  provider: string;
  merchantId: string;
  storeId: string | null;
  businessDate: string;
  currency: Currency;
  count: number;
  grossMinor: number;
};

/** `settlement.Reported` — the world (the provider): the batch it settles — gross, its fee, deductions, net — and its breakdown. */
export type SettlementReported = {
  batchId: string;
  provider: string;
  merchantId: string;
  storeId: string | null;
  channel: 'online' | 'in_store' | 'loyalty';
  businessDate: string;
  valueDate: string;
  currency: Currency;
  count: number;
  grossMinor: number;
  feeMinor: number;
  refundsMinor: number;
  chargebacksMinor: number;
  netMinor: number;
  lines: SettlementLine[];
};

/** `settlement.Credited` — the world (the bank): money for the batch reached the merchant's account. */
export type SettlementCredited = {
  batchId: string;
  account: string;
  valueDate: string;
  amountMinor: number;
  reference: string;
};

/** `settlement.Resolved` — the door, by a person: what was decided about a difference the reconciliation found. */
export type SettlementResolved = {
  batchId: string;
  resolution: 'accepted' | 'claim_raised' | 'written_off' | 'corrected';
  amountMinor: number;
  note: string;
  by: string;
};
