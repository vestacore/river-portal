import { factsFormingOf, type Projector, type PspFact } from '@river/psp-facts';
import type { InvoiceView } from './types/InvoiceView.ts';

function step(view: InvoiceView, fact: PspFact): InvoiceView {
  const v: InvoiceView = { ...view, attempts: { ...view.attempts }, updatedAt: fact.at };
  switch (fact.type) {
    case 'invoice.Sent': v.sent = [...v.sent, { at: fact.at, channel: fact.payload.channel }]; break;
    case 'invoice.Viewed': v.views += 1; v.viewedAt ??= fact.at; break;
    case 'invoice.Reminded': v.reminders = [...v.reminders, { at: fact.at, step: fact.payload.step, channel: fact.payload.channel, decidedBy: fact.payload.decidedBy }]; break;
    case 'invoice.Voided': v.voided = { at: fact.at, reason: fact.payload.reason, by: fact.payload.by }; break;
    case 'invoice.Adjusted': v.originalMinor ??= fact.payload.previousMinor; v.amountMinor = fact.payload.amountMinor; break;
    case 'session.Opened': v.attempts.opened += 1; v.sessionIds = [...v.sessionIds, fact.payload.sessionId]; break;
    case 'capture.Completed': v.paidMinor += fact.payload.amountMinor; break;
    case 'receipt.Issued': v.receiptIds = [...v.receiptIds, fact.payload.receiptId]; break;
    case 'session.Succeeded': v.attempts.succeeded += 1; break;
    case 'session.Failed': v.attempts.failed += 1; break;
    case 'session.Abandoned': v.attempts.abandoned += 1; break;
    case 'session.Expired': v.attempts.expired += 1; break;
    case 'refund.Completed':
    case 'dispute.Lost': v.refundedMinor += fact.payload.amountMinor; break;
    default: break;
  }
  return v;
}

/**
 * The invoice's reading (boundary `invoice`): its own facts, the sessions that tried to pay it and how
 * they ended, the captures that paid it, its receipts, and the money that went back — keyed by the
 * `invoiceId` every one of them carries.
 */
export const invoiceProjector: Projector<InvoiceView> = {
  projection: 'invoice',
  hears: factsFormingOf('invoice'),
  keyOf: (fact) => ('invoiceId' in fact.payload ? String(fact.payload.invoiceId) : null),
  project: (view, fact) => {
    if (fact.type === 'invoice.Issued') {
      const p = fact.payload;
      return {
        invoiceId: p.invoiceId, orderId: p.orderId, unitId: p.unitId, merchantId: p.merchantId, number: p.number, issuedAt: fact.at, updatedAt: fact.at,
        dueAt: p.dueAt, amountMinor: p.amountMinor, originalMinor: null, currency: p.currency, allowPartial: p.allowPartial, payKeyHash: p.payKeyHash,
        paidMinor: 0, refundedMinor: 0, sent: [], viewedAt: null, views: 0, reminders: [], sessionIds: [],
        attempts: { opened: 0, succeeded: 0, failed: 0, abandoned: 0, expired: 0 }, receiptIds: [], voided: null,
      };
    }
    return view ? step(view, fact) : null;
  },
};
