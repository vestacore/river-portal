import type { SettlementLine } from '@river/psp-facts';
import { cardProfileOf } from '@river/psp-instruments';
import { payoutsDue } from '@river/psp-payment';
import { policyValue } from '@river/psp-units';
import { appendFacts } from './appendFacts.ts';
import { effectiveFor } from './effectiveFor.ts';
import type { World } from './types/World.ts';

const lag: Record<string, number> = { 'T+0': 0, 'T+1': 1, 'T+2': 2, weekly: 7 };

type Batch = { provider: string; merchantId: string; currency: string; count: number; grossMinor: number; feeMinor: number; lines: Map<string, SettlementLine> };

/**
 * The settlement run. Every share whose hold has passed and that nothing carried yet leaves for its
 * recipient once the unit's schedule allows (T+1, T+2, weekly). Where the platform holds the money, it
 * pays the shares out, batched by recipient and day. Where acquirers settle to the merchant directly, each
 * acquirer settles the merchant's share and keeps its own fee, in one batch per acquirer, merchant and
 * day, and reports the batch — gross, fee, the refunds and chargebacks it nets, net, and a breakdown by
 * issuer and card product. Payouts a person put on hold wait — and so, in the demo's story, do a few the
 * acquirer's settlement file missed.
 */
export function runPayouts(world: World, at: string, only?: ReadonlySet<string>): number {
  let sent = 0;
  const day = at.slice(0, 10).replace(/-/g, '');
  const batches = new Map<string, Batch>();
  for (const payment of world.views.payments.values()) {
    if (only && !only.has(payment.paymentId)) continue;
    if (world.heldPayouts.includes(payment.paymentId) || world.lostSettlement.includes(payment.paymentId) || !payment.capturedAt) continue;
    const effective = effectiveFor(world, payment.unitId);
    const schedule = String(policyValue(effective, 'settlement.schedule') ?? 'T+1');
    const ready = new Date(Date.parse(payment.capturedAt.slice(0, 10)) + (lag[schedule] ?? 1) * 86_400_000).toISOString();
    if (ready > at) continue;
    const direct = policyValue(effective, 'settlement.model') === 'direct';
    // An acquirer settling directly settles the capture as it was; refunds and lost disputes come off later batches.
    const settled = new Set(payment.payouts.map((x) => `${x.recipientUnitId}:${x.rule}`));
    const due = direct
      ? payment.capturedMinor > 0 ? payment.allocations.filter((a) => a.amountMinor > 0 && !settled.has(`${a.recipientUnitId}:${a.rule}`) && (a.holdUntil === null || a.holdUntil <= at)) : []
      : payoutsDue(payment, at);
    if (due.length === 0) continue;
    const batchId = direct ? `stl_${payment.acquirer}_${payment.merchantId}_${day}` : null;
    appendFacts(world, payment.paymentId, due.map((a) => ({ type: 'payout.Sent' as const, payload: {
      paymentId: payment.paymentId, batchId: batchId ?? `po_${a.recipientUnitId.replace(/^ou-/, '')}_${day}${a.role === 'reserve' ? '_r' : ''}`, acquirer: payment.acquirer, rule: a.rule,
      recipientUnitId: a.recipientUnitId, amountMinor: a.amountMinor, currency: a.currency,
    } })), { via: 'world', controller: `${payment.acquirer}:settlement`, answering: null }, at);
    sent += due.length;
    if (!batchId) continue;
    const batch = batches.get(batchId) ?? { provider: payment.acquirer, merchantId: payment.merchantId, currency: payment.currency, count: 0, grossMinor: 0, feeMinor: 0, lines: new Map() };
    const gross = due.reduce((s, a) => s + a.amountMinor, 0);
    const fee = due.filter((a) => a.role === 'acquirer_fee').reduce((s, a) => s + a.amountMinor, 0);
    batch.count += 1;
    batch.grossMinor += gross;
    batch.feeMinor += fee;
    const session = world.views.sessions.get(payment.sessionId);
    const card = cardProfileOf(session?.detail, world.units.find((u) => u.id === payment.merchantId)?.country ?? 'UA');
    const onUs = session?.route?.onUs ?? false;
    // Card lines break down by issuing bank, scheme and product; any other instrument is one line of its own.
    const isCard = payment.instrument === 'card' || payment.instrument === 'apple_pay' || payment.instrument === 'google_pay';
    const product = isCard ? card.product : 'other';
    const key = isCard ? `${card.issuer ?? '-'}|${card.scheme}|${product}|${onUs}` : `-|${payment.instrument}`;
    const line = batch.lines.get(key) ?? { issuer: isCard ? card.issuer : null, scheme: isCard ? card.scheme : payment.instrument, product, onUs: isCard && onUs, count: 0, grossMinor: 0, feeMinor: 0 };
    line.count += 1;
    line.grossMinor += gross;
    line.feeMinor += fee;
    batch.lines.set(key, line);
    batches.set(batchId, batch);
  }
  for (const [batchId, batch] of batches) reportBatch(world, batchId, batch, at);
  return sent;
}

/** The acquirer's report of one direct batch, netting the refunds and lost disputes it has not netted yet. */
function reportBatch(world: World, batchId: string, batch: Batch, at: string): void {
  let refundsMinor = 0;
  let chargebacksMinor = 0;
  for (const p of world.views.payments.values()) {
    if (p.acquirer !== batch.provider || p.merchantId !== batch.merchantId) continue;
    for (const r of p.refunds) if (r.status === 'completed' && !world.netted.includes(r.refundId)) { refundsMinor += r.amountMinor; world.netted.push(r.refundId); }
    for (const d of p.disputes) if (d.status === 'lost' && !world.netted.includes(d.disputeId)) { chargebacksMinor += d.amountMinor; world.netted.push(d.disputeId); }
  }
  const quirk = world.quirks[batchId];
  const feeMinor = batch.feeMinor + (quirk?.feeDeltaMinor ?? 0);
  const grossMinor = batch.grossMinor + (quirk?.grossDeltaMinor ?? 0);
  const loyalty = batch.provider === 'bonus-system';
  const business = new Date(Date.parse(at) - 86_400_000).toISOString().slice(0, 10);
  appendFacts(world, batchId, [{ type: 'settlement.Reported', payload: {
    batchId, provider: batch.provider, merchantId: batch.merchantId, storeId: null, channel: loyalty ? 'loyalty' : 'online', businessDate: business, valueDate: at.slice(0, 10),
    currency: batch.currency as never, count: batch.count, grossMinor, feeMinor, refundsMinor, chargebacksMinor,
    netMinor: loyalty ? 0 : grossMinor - feeMinor - refundsMinor - chargebacksMinor, lines: [...batch.lines.values()],
  } }], { via: 'world', controller: `${batch.provider}:settlement-report`, answering: null }, at);
}
