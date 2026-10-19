import type { Posting } from '@river/pay-facts';

/** True when, in every currency, the debits of a set of postings equal its credits. */
export function isBalanced(postings: readonly Posting[]): boolean {
  const net = new Map<string, number>();
  for (const posting of postings) {
    if (!Number.isInteger(posting.amountMinor) || posting.amountMinor < 0) return false;
    net.set(posting.currency, (net.get(posting.currency) ?? 0) + (posting.side === 'debit' ? posting.amountMinor : -posting.amountMinor));
  }
  return [...net.values()].every((value) => value === 0);
}
