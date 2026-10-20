import type { Currency, Posting } from '@river/psp-facts';
import type { Balance } from './types/Balance.ts';

/** The balance of every account and currency that appears in the postings, sorted by account. */
export function balancesOf(postings: readonly Posting[]): Balance[] {
  const byKey = new Map<string, Balance>();
  for (const p of postings) {
    const key = `${p.account}|${p.currency}`;
    const b = byKey.get(key) ?? { account: p.account, currency: p.currency as Currency, debitMinor: 0, creditMinor: 0, balanceMinor: 0 };
    if (p.side === 'debit') b.debitMinor += p.amountMinor;
    else b.creditMinor += p.amountMinor;
    b.balanceMinor = b.debitMinor - b.creditMinor;
    byKey.set(key, b);
  }
  return [...byKey.values()].sort((a, b) => a.account.localeCompare(b.account) || a.currency.localeCompare(b.currency));
}
