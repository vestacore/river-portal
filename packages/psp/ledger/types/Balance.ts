import type { Currency, Posting } from '@river/psp-facts';

/** The balance of one account in one currency: debits less credits. */
export type Balance = {
  account: string;
  currency: Currency;
  debitMinor: number;
  creditMinor: number;
  balanceMinor: number;
};

/** A journal line: postings with the fact that formed them. */
export type JournalEntry = {
  stream: string;
  seq: number;
  type: string;
  at: string;
  postings: Posting[];
};
