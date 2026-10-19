import type { Posting } from './Posting.ts';

/** `ledger.Posted` — a figure: the balanced double entry of one capture. */
export type LedgerPosted = {
  postings: Posting[];
};
