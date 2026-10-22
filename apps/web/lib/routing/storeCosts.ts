import type { World } from '@river/psp-runtime';

export type StoreCostLine = { provider: string; currency: string; stores: number; batches: number; count: number; grossMinor: number; feeMinor: number; onUsGrossMinor: number };

/**
 * The stores' card turnover and what their terminal banks charged for it, by bank, from the banks' own daily
 * reports of the business days `[fromDate, toDate)` — payments the platform does not carry; it reads the
 * reports to reconcile them and to compare the banks. Within a profile's reach.
 */
export function storeCosts(w: World, visible: ReadonlySet<string>, fromDate: string, toDate = '9999-12-31'): StoreCostLine[] {
  const banks = new Map<string, StoreCostLine & { storeIds: Set<string> }>();
  for (const v of w.views.settlements.values()) {
    if (v.channel !== 'in_store' || !v.reported || v.businessDate < fromDate || v.businessDate >= toDate) continue;
    if (!(v.storeId ? visible.has(v.storeId) : visible.has(v.merchantId))) continue;
    const key = `${v.provider}|${v.currency}`;
    const e = banks.get(key) ?? { provider: v.provider, currency: v.currency, stores: 0, batches: 0, count: 0, grossMinor: 0, feeMinor: 0, onUsGrossMinor: 0, storeIds: new Set<string>() };
    e.batches += 1;
    e.count += v.reported.count;
    e.grossMinor += v.reported.grossMinor;
    e.feeMinor += v.reported.feeMinor;
    e.onUsGrossMinor += v.reported.lines.filter((l) => l.onUs).reduce((s, l) => s + l.grossMinor, 0);
    if (v.storeId) e.storeIds.add(v.storeId);
    banks.set(key, e);
  }
  return [...banks.values()].map(({ storeIds, ...line }) => ({ ...line, stores: storeIds.size })).sort((a, b) => b.grossMinor - a.grossMinor);
}
