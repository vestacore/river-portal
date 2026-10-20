import type { Posting } from '@river/psp-facts';

/** Whether, in every currency, debits equal credits — currencies never net against each other. */
export function isBalanced(postings: readonly Posting[]): boolean {
  const net = new Map<string, number>();
  for (const p of postings) net.set(p.currency, (net.get(p.currency) ?? 0) + (p.side === 'debit' ? p.amountMinor : -p.amountMinor));
  return [...net.values()].every((v) => v === 0);
}
