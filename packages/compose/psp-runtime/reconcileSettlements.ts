import { acquiringCostOf } from '@river/psp-contracts';
import { reconcileBatch, type ExpectedBatch, type Reconciliation, type SettlementView } from '@river/psp-settlement';
import { acquiringTermsFor } from './acquiringTermsFor.ts';
import type { World } from './types/World.ts';

const memo = new WeakMap<World, { key: string; rows: Array<{ view: SettlementView; reconciliation: Reconciliation }> }>();

/**
 * Every settlement batch of the stand, reconciled three ways. What a batch should hold comes from the
 * platform's own payments where it carried them (the shares it settled in that batch, the acquirer's fee
 * among them), and otherwise from the merchant's sales record and its acquiring terms: the fee each line
 * of the bank's own breakdown should have cost. Newest first.
 */
export function reconcileSettlements(world: World, now: string): Array<{ view: SettlementView; reconciliation: Reconciliation }> {
  const key = `${world.version}|${now.slice(0, 13)}`;
  const cached = memo.get(world);
  if (cached && cached.key === key) return cached.rows;
  const carried = new Map<string, { gross: number; fee: number }>();
  for (const p of world.views.payments.values()) {
    for (const x of p.payouts) {
      if (!x.batchId.startsWith('stl_')) continue;
      const e = carried.get(x.batchId) ?? { gross: 0, fee: 0 };
      e.gross += x.amountMinor;
      if (x.recipientUnitId.startsWith('acq:')) e.fee += x.amountMinor;
      carried.set(x.batchId, e);
    }
  }
  const rows = [...world.views.settlements.values()].map((view) => {
    let expected: ExpectedBatch | null = null;
    const own = carried.get(view.batchId);
    if (own) expected = { grossMinor: own.gross, feeMinor: own.fee, netMinor: null, source: 'payments' };
    else if (view.channel === 'in_store') {
      const terms = acquiringTermsFor(world, view.merchantId, view.provider, 'in_store');
      const fee = terms && view.reported ? view.reported.lines.reduce((s, l) => s + acquiringCostOf(terms, { scheme: l.scheme, product: l.product, domestic: l.issuer !== null, onUs: l.onUs }, l.grossMinor).totalMinor, 0) : null;
      expected = { grossMinor: view.sales?.grossMinor ?? null, feeMinor: fee, netMinor: null, source: 'sales' };
    }
    return { view, reconciliation: reconcileBatch(view, expected, now, Math.max(100, view.reported?.count ?? 0)) };
  }).sort((a, b) => b.view.businessDate.localeCompare(a.view.businessDate) || a.view.batchId.localeCompare(b.view.batchId));
  memo.set(world, { key, rows });
  return rows;
}
