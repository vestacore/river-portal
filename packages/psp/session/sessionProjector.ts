import { factDefinition, factsFormingOf, stages, type Projector, type PspFact, type Stage } from '@river/psp-facts';
import type { SessionView } from './types/SessionView.ts';

const order = (stage: Stage) => stages.indexOf(stage);

function step(view: SessionView, fact: PspFact): SessionView {
  const v: SessionView = { ...view, updatedAt: fact.at, bridges: view.bridges + 1, last: fact.type };
  const stage = factDefinition(fact.type).stage;
  if (stage && order(stage) >= order(v.stage)) {
    v.stage = stage;
    if (!v.reached.includes(stage)) v.reached = [...v.reached, stage];
  }
  switch (fact.type) {
    case 'instrument.Chosen': v.instrument = fact.payload.instrument; v.detail = fact.payload.detail; break;
    case 'risk.Scored': v.risk = { score: fact.payload.score, level: fact.payload.level, reasons: fact.payload.reasons, decision: fact.payload.decision }; break;
    case 'review.Opened': v.review = { alertId: fact.payload.alertId, reason: fact.payload.reason, status: 'open', by: null }; v.outcome = 'review'; break;
    case 'review.Cleared':
      v.review = v.review ? { ...v.review, status: 'cleared', by: fact.payload.by } : null;
      if (v.failure?.code.startsWith('mismatch_')) v.failure = null;
      v.outcome = 'open';
      break;
    case 'review.Rejected': v.review = v.review ? { ...v.review, status: 'rejected', by: fact.payload.by } : null; break;
    case 'route.Chosen': v.route = { rail: fact.payload.rail, acquirer: fact.payload.acquirer, rule: fact.payload.rule }; break;
    case 'authentication.Challenged': v.consent = fact.type; v.outcome = 'awaiting_consent'; break;
    case 'authentication.Passed':
    case 'token.Verified':
    case 'consent.Granted':
    case 'mandate.Signed':
    case 'qr.Scanned':
    case 'voucher.Paid': v.consent = fact.type; v.outcome = 'open'; break;
    case 'transfer.Instructed':
    case 'qr.Issued':
    case 'voucher.Issued':
    case 'address.Issued':
    case 'chain.Seen':
    case 'collection.Submitted': v.consent ??= fact.type; v.outcome = 'awaiting_funds'; break;
    case 'authorisation.Approved':
    case 'funds.Received':
      v.paymentId = fact.payload.paymentId;
      v.captureMode = fact.payload.captureMode;
      v.outcome = fact.payload.captureMode === 'manual' ? 'awaiting_capture' : 'open';
      break;
    case 'capture.Completed': v.capturedMinor += fact.payload.amountMinor; v.feeMinor += fact.payload.feeMinor; v.outcome = 'open'; break;
    case 'receipt.Issued': v.receiptId = fact.payload.receiptId; break;
    case 'authentication.Failed': v.failure = { code: 'authentication_failed', reason: fact.payload.reason }; break;
    case 'authorisation.Declined': v.failure = { code: fact.payload.code, reason: fact.payload.reason }; break;
    case 'credit.Declined': v.failure = { code: 'credit_declined', reason: fact.payload.reason }; break;
    case 'funds.Mismatched':
      v.failure = { code: `mismatch_${fact.payload.reason}`, reason: `${fact.payload.gotMinor} ≠ ${fact.payload.expectedMinor}` };
      v.mismatch = { expectedMinor: fact.payload.expectedMinor, gotMinor: fact.payload.gotMinor };
      v.review = { alertId: fact.payload.alertId, reason: 'mismatch', status: 'open', by: null };
      v.outcome = 'review';
      break;
    case 'session.Succeeded': v.outcome = 'succeeded'; v.closedAt = fact.at; break;
    case 'session.Failed': v.outcome = 'failed'; v.closedAt = fact.at; v.failure ??= { code: fact.payload.code, reason: fact.payload.reason }; break;
    case 'session.Abandoned': v.outcome = 'abandoned'; v.closedAt = fact.at; break;
    case 'session.Expired': v.outcome = 'expired'; v.closedAt = fact.at; break;
    default: break;
  }
  return v;
}

/**
 * The session's reading (boundary `session`): the attempt as a river. Every bridge moves it along the
 * stages — never back — and says whom it waits for; a final bridge closes it. It hears only its own
 * stream: what the attempt did to the invoice, the order and the payment, those boundaries form themselves.
 */
export const sessionProjector: Projector<SessionView> = {
  projection: 'session',
  hears: factsFormingOf('session'),
  keyOf: (fact) => ('sessionId' in fact.payload ? String(fact.payload.sessionId) : null),
  project: (view, fact) => {
    if (fact.type === 'session.Opened') {
      const p = fact.payload;
      return {
        sessionId: p.sessionId, invoiceId: p.invoiceId, orderId: p.orderId, unitId: p.unitId, merchantId: p.merchantId, amountMinor: p.amountMinor,
        currency: p.currency, channel: p.channel, locale: p.locale, country: p.country, openedAt: fact.at, updatedAt: fact.at, closedAt: null,
        expiresAt: p.expiresAt, stage: 'source', reached: ['source'], outcome: 'open', instrument: null, detail: null, risk: null, review: null,
        route: null, consent: null, paymentId: null, captureMode: null, capturedMinor: 0, feeMinor: 0, receiptId: null, failure: null, mismatch: null, bridges: 1, last: fact.type,
      };
    }
    return view ? step(view, fact) : null;
  },
};
