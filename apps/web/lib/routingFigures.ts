import { acquiringCostOf, type AcquiringCost } from '@river/psp-contracts';
import type { InstrumentId } from '@river/psp-facts';
import { chooseRoute, type RouteStrategy } from '@river/psp-flow';
import { acquirers, issuers, type CardProduct } from '@river/psp-instruments';
import { isWithin, policyValue, type PolicySetting } from '@river/psp-units';
import { effectiveFor, reconcileSettlements, type World } from '@river/psp-runtime';

const day = 86_400_000;
const cardLike: ReadonlySet<InstrumentId> = new Set(['card', 'apple_pay', 'google_pay']);

/** The acquiring cost of the card payments captured since a moment: volume, fee, effective rate, on-us share, by acquirer. */
export function cardCostSince(w: World, from: string, to?: string) {
  let count = 0;
  let gross = 0;
  let fee = 0;
  let onUs = 0;
  const byAcquirer = new Map<string, { acquirer: string; count: number; grossMinor: number; feeMinor: number; onUs: number }>();
  for (const p of w.views.payments.values()) {
    if (!p.capturedAt || p.capturedAt < from || (to && p.capturedAt >= to) || !cardLike.has(p.instrument) || p.currency !== 'UAH') continue;
    const f = p.allocations.filter((a) => a.role === 'acquirer_fee').reduce((s, a) => s + a.amountMinor, 0);
    const own = w.views.sessions.get(p.sessionId)?.route?.onUs ?? false;
    count += 1;
    gross += p.capturedMinor;
    fee += f;
    if (own) onUs += 1;
    const e = byAcquirer.get(p.acquirer) ?? { acquirer: p.acquirer, count: 0, grossMinor: 0, feeMinor: 0, onUs: 0 };
    e.count += 1;
    e.grossMinor += p.capturedMinor;
    e.feeMinor += f;
    if (own) e.onUs += 1;
    byAcquirer.set(p.acquirer, e);
  }
  const bps = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 10_000) : 0);
  return { count, grossMinor: gross, feeMinor: fee, rateBps: bps(fee, gross), onUsBps: bps(onUs, count), byAcquirer: [...byAcquirer.values()].sort((a, b) => b.grossMinor - a.grossMinor) };
}

/** Week by week, the on-us share and the effective rate of the routed card sessions — what the routing decisions expected. */
export function routingWeeks(w: World): Array<{ week: string; sessions: number; onUsBps: number; rateBps: number }> {
  const weeks = new Map<string, { n: number; onUs: number; fee: number; gross: number }>();
  for (const s of w.views.sessions.values()) {
    if (!s.route || s.route.rail !== 'card' || s.route.feeMinor === null || s.currency !== 'UAH') continue;
    const monday = new Date(Date.parse(s.openedAt.slice(0, 10)));
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    const e = weeks.get(key) ?? { n: 0, onUs: 0, fee: 0, gross: 0 };
    e.n += 1;
    if (s.route.onUs) e.onUs += 1;
    e.fee += s.route.feeMinor;
    e.gross += s.amountMinor;
    weeks.set(key, e);
  }
  return [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).filter(([, v]) => v.n >= 20)
    .map(([week, v]) => ({ week, sessions: v.n, onUsBps: Math.round((v.onUs / v.n) * 10_000), rateBps: v.gross > 0 ? Math.round((v.fee / v.gross) * 10_000) : 0 }));
}

/** The routing strategy set at the root of the stand: its value, who set it and when. */
export function strategyChange(w: World): PolicySetting | null {
  const root = w.units.find((u) => u.parentId === null)?.id;
  return w.settings.find((s) => s.unitId === root && s.key === 'routing.strategy') ?? null;
}

/** Reconciliation of the batches of a period: how many matched, how many differ and by how much. */
export function reconciliationSince(w: World, now: string, days: number) {
  const from = new Date(Date.parse(now) - days * day).toISOString().slice(0, 10);
  const rows = reconcileSettlements(w, now).filter((r) => r.view.businessDate >= from);
  const open = rows.filter((r) => !['matched', 'resolved', 'awaiting_report', 'awaiting_credit'].includes(r.reconciliation.status));
  const byStatus = new Map<string, { count: number; deltaMinor: number }>();
  for (const r of open) {
    const e = byStatus.get(r.reconciliation.status) ?? { count: 0, deltaMinor: 0 };
    e.count += 1;
    e.deltaMinor += r.reconciliation.differences.reduce((s, d) => s + Math.abs(d.deltaMinor), 0);
    byStatus.set(r.reconciliation.status, e);
  }
  return {
    batches: rows.length,
    matched: rows.filter((r) => r.reconciliation.status === 'matched').length,
    open: open.length,
    byStatus,
    reportedMinor: rows.reduce((s, r) => s + (r.view.reported?.grossMinor ?? 0), 0),
    stores: new Set(rows.filter((r) => r.view.channel === 'in_store').map((r) => r.view.storeId)).size,
    providers: new Set(rows.map((r) => r.view.provider)).size,
  };
}

/** The money of every unit's subtree since a moment: the online payments captured, and the stores' card turnover from the banks' reports. */
export function groupFlows(w: World, from: string): Record<string, number> {
  const paid = [...w.views.payments.values()].filter((p) => p.capturedAt !== null && p.capturedAt >= from && p.currency === 'UAH');
  const tills = [...w.views.settlements.values()].filter((v) => v.channel === 'in_store' && v.reported && v.storeId && v.businessDate >= from.slice(0, 10));
  return Object.fromEntries(w.units.map((u) => [u.id,
    paid.filter((p) => isWithin(w.units, p.unitId, u.id)).reduce((s, p) => s + p.capturedMinor, 0)
    + tills.filter((v) => isWithin(w.units, v.storeId!, u.id)).reduce((s, v) => s + v.reported!.grossMinor, 0)]));
}

/**
 * One card payment priced at every card acquirer of the stand under the merchant's online terms, and the
 * route the routing function itself chooses for it under the group's strategy and threshold.
 */
export function routeExample(w: World, input: { merchantId: string; issuerId: string; product: CardProduct; amountMinor: number }) {
  const issuer = issuers.find((i) => i.id === input.issuerId)!;
  const range = issuer.bins.find((b) => b.product === input.product) ?? issuer.bins[0]!;
  const root = w.units.find((u) => u.parentId === null)!.id;
  const effective = effectiveFor(w, input.merchantId);
  const strategy = String(policyValue(effective, 'routing.strategy') ?? 'approval_first') as RouteStrategy;
  const minApprovalBps = Number(policyValue(effective, 'routing.minApproval.bps') ?? 9_000);
  const options = w.acquiring.filter((t) => t.merchantId === input.merchantId && t.channel === 'online' && acquirers.find((a) => a.id === t.acquirerId)?.rails.includes('card')).map((terms) => {
    const onUs = issuer.acquirerIds.includes(terms.acquirerId);
    const cost: AcquiringCost = acquiringCostOf(terms, { scheme: range.scheme, product: range.product, domestic: true, onUs }, input.amountMinor);
    return { acquirer: acquirers.find((a) => a.id === terms.acquirerId)!, terms, onUs: onUs && terms.onUsBps !== null, cost };
  });
  const choice = chooseRoute({ rail: 'card', region: 'UA', sessionId: `example-${root}`, routeTo: null, available: options.map((o) => o.acquirer.id), strategy, minApprovalBps,
    quotes: options.map((o) => ({ acquirer: o.acquirer.id, feeMinor: o.cost.totalMinor, onUs: o.onUs })) });
  return { issuer, range, strategy, minApprovalBps, options: options.map((o) => ({ ...o, chosen: o.acquirer.id === choice.acquirer, eligible: choice.alternatives.find((a) => a.acquirer === o.acquirer.id)?.eligible ?? false })), choice };
}
