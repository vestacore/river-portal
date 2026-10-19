import type { Currency } from './Currency.ts';

/**
 * One line of a double entry. A set of postings is balanced when, per currency, debits equal
 * credits: water is neither made nor lost inside the river.
 */
export type Posting = {
  account: string;
  side: 'debit' | 'credit';
  amountMinor: number;
  currency: Currency;
};
