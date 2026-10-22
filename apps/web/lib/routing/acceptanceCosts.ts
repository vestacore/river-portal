import type { World } from '@river/psp-runtime';
import { cardOf } from './cardOf';

export type CostLine = { key: string; provider: string | null; currency: string; count: number; grossMinor: number; feeMinor: number; onUsCount: number };

const productOrder = ['debit', 'credit', 'premium', 'commercial', 'other'];
const railOrder = ['a2a', 'qr', 'transfer', 'debit', 'credit', 'wallet', 'chain', 'cash', 'loyalty'];

/**
 * What accepting the captured payments of a period cost, within a profile's reach: online card payments as
 * a whole, by acquirer, by card product and on-us against the rest; the other rails by provider. The fee of
 * a payment is the acquirer's share of its split where the acquirer settles to the merchant directly, and
 * the PSP's fee where the platform holds the money (`feeKind`).
 */
export function acceptanceCosts(w: World, visible: ReadonlySet<string>, from: string, to: string) {
  const maps = { card: new Map<string, CostLine>(), byAcquirer: new Map<string, CostLine>(), byProduct: new Map<string, CostLine>(), byOnUs: new Map<string, CostLine>(), rails: new Map<string, CostLine>() };
  const add = (map: Map<string, CostLine>, key: string, provider: string | null, currency: string, grossMinor: number, feeMinor: number, onUs: boolean) => {
    const id = `${key}|${provider ?? ''}|${currency}`;
    const e = map.get(id) ?? { key, provider, currency, count: 0, grossMinor: 0, feeMinor: 0, onUsCount: 0 };
    e.count += 1;
    e.grossMinor += grossMinor;
    e.feeMinor += feeMinor;
    if (onUs) e.onUsCount += 1;
    map.set(id, e);
  };
  for (const p of w.views.payments.values()) {
    if (!visible.has(p.unitId) || !p.capturedAt || p.capturedAt < from || p.capturedAt >= to || p.capturedMinor <= 0) continue;
    const own = p.allocations.filter((a) => a.role === 'acquirer_fee');
    const fee = own.length > 0 ? own.reduce((s, a) => s + a.amountMinor, 0) : p.feeMinor;
    if (p.rail === 'card') {
      const { card, onUs } = cardOf(w, p);
      add(maps.card, 'card', null, p.currency, p.capturedMinor, fee, onUs);
      add(maps.byAcquirer, p.acquirer, p.acquirer, p.currency, p.capturedMinor, fee, onUs);
      add(maps.byProduct, card.product, null, p.currency, p.capturedMinor, fee, onUs);
      add(maps.byOnUs, onUs ? 'on_us' : 'other', null, p.currency, p.capturedMinor, fee, onUs);
    } else add(maps.rails, p.rail, p.acquirer, p.currency, p.capturedMinor, fee, false);
  }
  const byGross = (a: CostLine, b: CostLine) => a.currency.localeCompare(b.currency) || b.grossMinor - a.grossMinor;
  const byOrder = (order: string[]) => (a: CostLine, b: CostLine) => a.currency.localeCompare(b.currency) || order.indexOf(a.key) - order.indexOf(b.key) || b.grossMinor - a.grossMinor;
  return {
    feeKind: (w.feeRecipient === null ? 'acquirer' : 'psp') as 'acquirer' | 'psp',
    card: [...maps.card.values()].sort(byGross),
    byAcquirer: [...maps.byAcquirer.values()].sort(byGross),
    byProduct: [...maps.byProduct.values()].sort(byOrder(productOrder)),
    byOnUs: [...maps.byOnUs.values()].sort(byOrder(['on_us', 'other'])),
    rails: [...maps.rails.values()].sort(byOrder(railOrder)),
  };
}
