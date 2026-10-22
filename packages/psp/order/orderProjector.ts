import { factsFormingOf, type Allocation, type Projector, type PspFact } from '@river/psp-facts';
import type { OrderStatus } from './types/OrderStatus.ts';
import type { OrderView } from './types/OrderView.ts';

function statusOf(view: OrderView): OrderStatus {
  const held = Object.values(view.held).reduce((a, b) => a + b, 0);
  const returned = view.refundedMinor + view.chargebackMinor;
  if (view.cancelled) return 'cancelled';
  if (Object.keys(view.disputes).length > 0) return 'disputed';
  if (view.paidMinor > 0 && returned >= view.paidMinor) return 'refunded';
  if (returned > 0) return 'partially_refunded';
  if (view.paidMinor >= (view.picked?.totalMinor ?? view.totalMinor) && view.paidMinor > 0) return 'paid';
  if (view.paidMinor > 0) return 'partially_paid';
  if (held > 0) return 'authorised';
  return 'awaiting_payment';
}

/** Adds shares to the net delta: one line per recipient and role. */
function merge(into: readonly Allocation[], add: readonly Allocation[]): Allocation[] {
  const out = into.map((a) => ({ ...a }));
  for (const share of add) {
    const same = out.find((a) => a.recipientUnitId === share.recipientUnitId && a.role === share.role);
    if (same) same.amountMinor += share.amountMinor;
    else out.push({ ...share });
  }
  return out;
}

function step(view: OrderView, fact: PspFact): OrderView {
  const v: OrderView = { ...view, held: { ...view.held }, disputes: { ...view.disputes }, updatedAt: fact.at, timeline: [...view.timeline, { at: fact.at, type: fact.type, stream: fact.stream, seq: fact.seq }] };
  switch (fact.type) {
    case 'order.Cancelled': v.cancelled = { reason: fact.payload.reason, by: fact.payload.by }; break;
    case 'fulfilment.Accepted': v.fulfilment = 'accepted'; break;
    case 'fulfilment.Shipped': v.fulfilment = 'shipped'; v.tracking = { carrier: fact.payload.carrier, ref: fact.payload.trackingRef }; break;
    case 'fulfilment.Delivered': v.fulfilment = 'delivered'; break;
    case 'fulfilment.Picked': v.fulfilment = 'picked'; v.picked = { lines: fact.payload.lines, totalMinor: fact.payload.totalMinor, changes: fact.payload.changes }; break;
    case 'invoice.Issued': if (!v.invoiceIds.includes(fact.payload.invoiceId)) v.invoiceIds = [...v.invoiceIds, fact.payload.invoiceId]; break;
    case 'invoice.Voided': break;
    case 'authorisation.Approved':
    case 'funds.Received':
      v.held[fact.payload.paymentId] = fact.payload.amountMinor;
      if (!v.paymentIds.includes(fact.payload.paymentId)) v.paymentIds = [...v.paymentIds, fact.payload.paymentId];
      break;
    case 'authorisation.Expired':
    case 'capture.Voided': delete v.held[fact.payload.paymentId]; break;
    case 'capture.Completed': delete v.held[fact.payload.paymentId]; v.paidMinor += fact.payload.amountMinor; break;
    case 'split.Allocated': v.allocations = merge(v.allocations, fact.payload.allocations); break;
    case 'refund.Completed': v.refundedMinor += fact.payload.amountMinor; v.allocations = merge(v.allocations, fact.payload.allocations); break;
    case 'dispute.Opened': v.disputes[fact.payload.disputeId] = fact.payload.amountMinor; break;
    case 'dispute.Won': delete v.disputes[fact.payload.disputeId]; break;
    case 'dispute.Lost':
      delete v.disputes[fact.payload.disputeId];
      v.chargebackMinor += fact.payload.amountMinor;
      v.allocations = merge(v.allocations, fact.payload.allocations);
      break;
    default: break;
  }
  v.status = statusOf(v);
  return v;
}

/**
 * The order's reading (boundary `order`). It hears exactly the facts the catalogue lists as forming
 * the order — its own (created, cancelled, fulfilment) and other boundaries' (an invoice issued, a
 * payment born, captured, split, refunded, disputed) — keyed by the `orderId` every one of them carries.
 */
export const orderProjector: Projector<OrderView> = {
  projection: 'order',
  hears: factsFormingOf('order'),
  keyOf: (fact) => ('orderId' in fact.payload ? String(fact.payload.orderId) : null),
  project: (view, fact) => {
    if (fact.type === 'order.Created') {
      const p = fact.payload;
      return {
        orderId: p.orderId, unitId: p.unitId, merchantId: p.merchantId, reference: p.reference, channel: p.channel, createdAt: fact.at, updatedAt: fact.at,
        currency: p.currency, lines: p.lines, totalMinor: p.totalMinor, payerRef: p.payerRef, split: p.split, captureMode: p.captureMode,
        invoiceIds: [], paymentIds: [], held: {}, paidMinor: 0, refundedMinor: 0, chargebackMinor: 0, disputes: {},
        status: 'awaiting_payment', fulfilment: 'none', tracking: null, picked: null, allocations: [], cancelled: null,
        timeline: [{ at: fact.at, type: fact.type, stream: fact.stream, seq: fact.seq }],
      };
    }
    return view ? step(view, fact) : null;
  },
};
