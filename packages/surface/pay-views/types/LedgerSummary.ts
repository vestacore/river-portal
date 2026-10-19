import type { Currency } from '@river/pay-facts';
import type { Balance } from '@river/pay-ledger';

/**
 * The ledger of the river as the operator reads it. `balanced` is the law of conservation checked
 * over every posting: in each currency, debits equal credits. Per currency: what the providers
 * captured, what the platform kept, and what merchants are owed.
 */
export type LedgerSummary = {
  balanced: boolean;
  postings: number;
  balances: Balance[];
  totals: Array<{ currency: Currency; orders: number; capturedMinor: number; feesMinor: number; payableMinor: number }>;
};
