import type { Currency, Posting } from '@river/pay-facts';
import { accountBalances, isBalanced } from '@river/pay-ledger';
import type { LedgerSummary } from './types/LedgerSummary.ts';
import type { OrderView } from './types/OrderView.ts';

/**
 * The ledger over a set of orders: every posting the river wrote, checked for conservation and
 * folded into balances. Pure — the same orders always give the same summary.
 */
export function ledgerSummary(orders: readonly OrderView[]): LedgerSummary {
  const postings: Posting[] = orders.flatMap((order) => order.postings);
  const totals = new Map<Currency, { currency: Currency; orders: number; capturedMinor: number; feesMinor: number; payableMinor: number }>();
  for (const order of orders) {
    if (order.postings.length === 0) continue;
    const total = totals.get(order.currency) ?? { currency: order.currency, orders: 0, capturedMinor: 0, feesMinor: 0, payableMinor: 0 };
    total.orders += 1;
    for (const posting of order.postings) {
      if (posting.side === 'debit') total.capturedMinor += posting.amountMinor;
      else if (posting.account === 'platform:fees') total.feesMinor += posting.amountMinor;
      else total.payableMinor += posting.amountMinor;
    }
    totals.set(order.currency, total);
  }
  return {
    balanced: isBalanced(postings),
    postings: postings.length,
    balances: accountBalances(postings),
    totals: [...totals.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
  };
}
