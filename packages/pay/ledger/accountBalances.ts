import type { Posting } from '@river/pay-facts';
import type { Balance } from './types/Balance.ts';

/** Folds postings into the net position of each account and currency, ordered by account. */
export function accountBalances(postings: readonly Posting[]): Balance[] {
  const net = new Map<string, Balance>();
  for (const posting of postings) {
    const key = `${posting.account}|${posting.currency}`;
    const current = net.get(key) ?? { account: posting.account, currency: posting.currency, balanceMinor: 0 };
    current.balanceMinor += posting.side === 'debit' ? posting.amountMinor : -posting.amountMinor;
    net.set(key, current);
  }
  return [...net.values()].sort((a, b) => (a.account === b.account ? a.currency.localeCompare(b.currency) : a.account.localeCompare(b.account)));
}
