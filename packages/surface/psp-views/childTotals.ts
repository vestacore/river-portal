import type { Currency } from '@river/psp-facts';
import type { PaymentView } from '@river/psp-payment';
import type { SessionView } from '@river/psp-session';
import { childrenOf, isWithin, type Unit } from '@river/psp-units';

/**
 * What flows through each unit directly below a unit — every payment of the child's whole subtree —
 * since `from`: the view a parent has of its children's flows.
 */
export function childTotals(units: readonly Unit[], payments: readonly PaymentView[], sessions: readonly SessionView[], unitId: string, from: string): Array<{ unit: Unit; byCurrency: Partial<Record<Currency, number>>; payments: number; sessions: number; succeeded: number }> {
  return childrenOf(units, unitId).map((unit) => {
    const byCurrency: Partial<Record<Currency, number>> = {};
    let count = 0;
    for (const p of payments) {
      if (!p.capturedAt || p.capturedAt < from || !isWithin(units, p.unitId, unit.id)) continue;
      byCurrency[p.currency] = (byCurrency[p.currency] ?? 0) + p.capturedMinor;
      count += 1;
    }
    const s = sessions.filter((x) => x.openedAt >= from && isWithin(units, x.unitId, unit.id));
    return { unit, byCurrency, payments: count, sessions: s.length, succeeded: s.filter((x) => x.outcome === 'succeeded').length };
  });
}
