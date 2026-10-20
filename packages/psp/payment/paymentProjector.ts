import { factsFormingOf, type Projector, type PspFact } from '@river/psp-facts';
import type { PaymentStatus } from './types/PaymentStatus.ts';
import type { PaymentView } from './types/PaymentView.ts';

function statusOf(v: PaymentView, base: PaymentStatus): PaymentStatus {
  if (base === 'voided' || base === 'expired') return base;
  if (v.disputes.some((d) => d.status === 'open' || d.status === 'evidenced')) return 'disputed';
  if (v.chargebackMinor > 0) return 'chargeback';
  if (v.capturedMinor === 0) return base;
  if (v.refundedMinor >= v.capturedMinor) return 'refunded';
  if (v.refundedMinor > 0) return 'partially_refunded';
  return 'captured';
}

function step(view: PaymentView, fact: PspFact): PaymentView {
  const v: PaymentView = { ...view, updatedAt: fact.at };
  let base: PaymentStatus = view.status === 'authorised' || view.status === 'received' || view.status === 'voided' || view.status === 'expired' ? view.status : 'captured';
  switch (fact.type) {
    case 'authorisation.Expired': base = 'expired'; break;
    case 'capture.Voided': base = 'voided'; break;
    case 'capture.Completed':
      v.capturedMinor += fact.payload.amountMinor;
      v.feeMinor += fact.payload.feeMinor;
      v.capturedAt ??= fact.at;
      base = 'captured';
      break;
    case 'split.Allocated': v.allocations = [...v.allocations, ...fact.payload.allocations]; break;
    case 'refund.Requested':
      v.refunds = [...v.refunds, { refundId: fact.payload.refundId, amountMinor: fact.payload.amountMinor, reason: fact.payload.reason, by: fact.payload.by, status: 'requested', requestedAt: fact.at, closedAt: null }];
      break;
    case 'refund.Completed':
      v.refundedMinor += fact.payload.amountMinor;
      v.refunds = v.refunds.map((r) => (r.refundId === fact.payload.refundId ? { ...r, status: 'completed', closedAt: fact.at } : r));
      break;
    case 'refund.Failed': v.refunds = v.refunds.map((r) => (r.refundId === fact.payload.refundId ? { ...r, status: 'failed', closedAt: fact.at } : r)); break;
    case 'dispute.Opened':
      v.disputes = [...v.disputes, { disputeId: fact.payload.disputeId, amountMinor: fact.payload.amountMinor, reason: fact.payload.reason, respondBy: fact.payload.respondBy, status: 'open', openedAt: fact.at, closedAt: null }];
      break;
    case 'dispute.Evidenced': v.disputes = v.disputes.map((d) => (d.disputeId === fact.payload.disputeId ? { ...d, status: 'evidenced' } : d)); break;
    case 'dispute.Won': v.disputes = v.disputes.map((d) => (d.disputeId === fact.payload.disputeId ? { ...d, status: 'won', closedAt: fact.at } : d)); break;
    case 'dispute.Lost':
      v.chargebackMinor += fact.payload.amountMinor;
      v.disputes = v.disputes.map((d) => (d.disputeId === fact.payload.disputeId ? { ...d, status: 'lost', closedAt: fact.at } : d));
      break;
    case 'payout.Sent': v.payouts = [...v.payouts, { batchId: fact.payload.batchId, rule: fact.payload.rule, recipientUnitId: fact.payload.recipientUnitId, amountMinor: fact.payload.amountMinor, at: fact.at }]; break;
    default: break;
  }
  v.status = statusOf(v, base);
  return v;
}

/**
 * The payment's reading (boundary `payment`). A payment is born at the bridge where its session secures
 * the funds and carries everything this view needs; after that it hears the capture and the split of
 * its session, then its own stream — keyed by the `paymentId` every one of these facts carries.
 */
export const paymentProjector: Projector<PaymentView> = {
  projection: 'payment',
  hears: factsFormingOf('payment'),
  keyOf: (fact) => ('paymentId' in fact.payload ? String(fact.payload.paymentId) : null),
  project: (view, fact) => {
    if (fact.type === 'authorisation.Approved' || fact.type === 'funds.Received') {
      if (view) return view;
      const p = fact.payload;
      return {
        paymentId: p.paymentId, sessionId: p.sessionId, invoiceId: p.invoiceId, orderId: p.orderId, unitId: p.unitId, merchantId: p.merchantId,
        instrument: p.instrument, detail: p.detail, rail: p.rail, acquirer: p.acquirer, amountMinor: p.amountMinor, currency: p.currency, captureMode: p.captureMode,
        authCode: fact.type === 'authorisation.Approved' ? fact.payload.authCode : null, via: fact.type === 'funds.Received' ? fact.payload.via : null,
        createdAt: fact.at, updatedAt: fact.at, capturedAt: null, capturedMinor: 0, feeMinor: 0, refundedMinor: 0, chargebackMinor: 0,
        allocations: [], refunds: [], disputes: [], payouts: [], status: fact.type === 'authorisation.Approved' ? 'authorised' : 'received',
      };
    }
    return view ? step(view, fact) : null;
  },
};
