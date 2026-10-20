import { factCatalogue, stages, type AllocationRole, type Currency, type Stage } from '@river/psp-facts';
import type { OrderView } from '@river/psp-order';
import type { PaymentView } from '@river/psp-payment';
import type { World } from '@river/psp-runtime';
import { isWithin } from '@river/psp-units';

const day = 86_400_000;
/** Demo rate for drawing widths and totals across currencies only — never for money. */
export const eurInUah = 45;

export const sinceDays = (days: number) => new Date(Date.now() - days * day).toISOString();

/** Which views each stage of the river forms, as letters: Session, Order, Invoice, Payment, Ledger. */
export function formsOfStage(stage: Stage): string {
  const forms = new Set(factCatalogue.filter((d) => d.stage === stage).flatMap((d) => d.forms));
  return [['session', 'S'], ['order', 'O'], ['invoice', 'I'], ['payment', 'P'], ['ledger', 'L']].filter(([p]) => forms.has(p as never)).map(([, l]) => l).join('');
}

/** How many attempts reached each stage since a moment. */
export function stageCounts(world: World, from: string, scope?: ReadonlySet<string>): Record<Stage, number> {
  const counts = Object.fromEntries(stages.map((s) => [s, 0])) as Record<Stage, number>;
  for (const s of world.views.sessions.values()) {
    if (s.openedAt < from || (scope && !scope.has(s.unitId))) continue;
    for (const stage of s.reached) counts[stage] += 1;
  }
  return counts;
}

/** The money that flowed to each role of the delta since a moment, in one currency. */
export function roleShares(world: World, from: string, currency: Currency, scope?: ReadonlySet<string>): Record<AllocationRole, number> {
  const out: Record<AllocationRole, number> = { merchant: 0, seller: 0, platform: 0, psp_fee: 0, charity: 0, partner: 0, reserve: 0 };
  for (const p of world.views.payments.values()) {
    if (!p.capturedAt || p.capturedAt < from || p.currency !== currency || (scope && !scope.has(p.unitId))) continue;
    for (const a of p.allocations) out[a.role] += a.amountMinor;
  }
  return out;
}

/** Captured payments since a moment, optionally within a set of units. */
export function capturedSince(world: World, from: string, scope?: ReadonlySet<string>): PaymentView[] {
  return [...world.views.payments.values()].filter((p) => p.capturedAt !== null && p.capturedAt >= from && (!scope || scope.has(p.unitId)));
}

/** A recent marketplace order whose split shows every kind of stream, for the delta drawing. */
export function splitExample(world: World): { order: OrderView; payment: PaymentView } | null {
  let best: { order: OrderView; payment: PaymentView } | null = null;
  for (const payment of world.views.payments.values()) {
    if (payment.merchantId !== 'ou-kvitka-market' || payment.status !== 'captured') continue;
    const sellers = new Set(payment.allocations.filter((a) => a.role === 'seller').map((a) => a.recipientUnitId));
    if (sellers.size < 3 || !payment.allocations.some((a) => a.role === 'charity')) continue;
    const order = world.views.orders.get(payment.orderId);
    if (order && (!best || payment.capturedAt! > best.payment.capturedAt!)) best = { order, payment };
  }
  return best;
}

/** The flows of every unit's subtree since a moment, in hryvnia-equivalent minor units (for drawing widths). */
export function subtreeFlows(world: World, from: string): Record<string, number> {
  const flows: Record<string, number> = {};
  const payments = capturedSince(world, from);
  for (const unit of world.units) {
    flows[unit.id] = payments.filter((p) => isWithin(world.units, p.unitId, unit.id)).reduce((s, p) => s + p.capturedMinor * (p.currency === 'EUR' ? eurInUah : 1), 0);
  }
  return flows;
}
