import type { Reading } from '@river/figure';
import { payFacts, type InvoiceIssued, type OrderPaid, type OrderPlaced, type PaymentMismatched, type Posting, type ProviderName, type ProviderSessionOpened } from '@river/pay-facts';
import { attemptFacts, foldAttempt } from '@river/pay-flow';
import type { Fact } from '@river/stream';
import { payViewPaths } from './paths.ts';
import { statusOf } from './statusOf.ts';
import type { OrderView } from './types/OrderView.ts';

function fold(view: OrderView | null, fact: Fact): OrderView | null {
  const { payload, at } = fact;
  if (fact.type === payFacts.orderPlaced) {
    const order = payload as OrderPlaced;
    return {
      orderId: order.orderId, merchantId: order.merchantId, payerRef: order.payerRef, title: order.title, amountMinor: order.amountMinor, currency: order.currency,
      payKeyHash: order.payKeyHash, providers: [...order.providers], status: 'placed', placedAt: at, updatedAt: at, seq: fact.seq,
      invoice: null, attempts: { attempt: 0, open: null, failed: [] }, refused: false, route: null, session: null, sessionRef: null, lastFailure: null,
      captureSimulated: null, paid: null, receiptId: null, flag: null, cancelled: null, postings: [], posted: false,
    };
  }
  if (!view) return null;
  const before = view.attempts;
  const attempts = attemptFacts.includes(fact.type) ? foldAttempt(before, fact) : before;
  const next: OrderView = { ...view, attempts, seq: fact.seq, updatedAt: at };

  // An attempt that was under way and no longer is has failed, whatever said so.
  if (before.open && !attempts.open) {
    next.lastFailure = { provider: before.open.provider, reason: String(payload.reason ?? ''), at };
    next.session = null;
  }
  switch (fact.type) {
    case payFacts.invoiceIssued: {
      const invoice = payload as InvoiceIssued;
      next.invoice = { invoiceId: invoice.invoiceId, feeBps: invoice.feeBps, feeMinor: invoice.feeMinor, netMinor: invoice.netMinor, expiresAt: invoice.expiresAt };
      break;
    }
    case payFacts.providerRouted:
      next.route = { provider: payload.provider as ProviderName, reason: String(payload.reason) };
      next.session = null;
      next.refused = false;
      break;
    case payFacts.checkoutRefused:
      next.route = null;
      next.session = null;
      next.refused = true;
      next.lastFailure = { provider: null, reason: String(payload.reason), at };
      break;
    case payFacts.providerSessionOpened: {
      const opened = payload as ProviderSessionOpened;
      if (attempts.open?.sessionRef === opened.sessionRef && before.open?.sessionRef === null) {
        next.session = { provider: opened.provider, sessionRef: opened.sessionRef, redirectUrl: opened.redirectUrl, simulated: opened.simulated, openedAt: at };
      }
      break;
    }
    case payFacts.paymentCaptured:
      if (view.captureSimulated === null) next.captureSimulated = payload.simulated === true;
      break;
    case payFacts.paymentMismatched: {
      const mismatch = payload as PaymentMismatched;
      next.flag = { reason: mismatch.reason, providerRef: mismatch.providerRef, gotMinor: mismatch.gotMinor, gotCurrency: mismatch.gotCurrency, at };
      break;
    }
    case payFacts.ledgerPosted:
      next.postings = [...view.postings, ...(payload.postings as Posting[])];
      next.posted = true;
      break;
    case payFacts.orderPaid: {
      const paid = payload as OrderPaid;
      next.paid = { provider: paid.provider, providerRef: paid.providerRef, at, simulated: view.captureSimulated === true };
      break;
    }
    case payFacts.receiptIssued:
      next.receiptId = String(payload.receiptId);
      break;
    case payFacts.orderCancelled:
      next.cancelled = { reason: String(payload.reason), by: String(payload.by), at };
      break;
    default:
      break;
  }
  next.sessionRef = next.session?.sessionRef ?? null;
  next.status = statusOf(next);
  return next;
}

/**
 * The order view: one document per order, folded from every fact of its stream. Its attempts are
 * folded by the gate's own fold, so a report about an attempt that is no longer under way — a
 * failure told twice, a late expiry of an older session, an unasked failure while money is being
 * collected — changes the surface exactly as much as it changes the figure: not at all.
 */
export const orderReading: Reading = {
  id: 'order',
  hears: Object.values(payFacts),
  path: (root, stream) => payViewPaths.order(root, stream),
  project: (view, fact) => fold(view as OrderView | null, fact),
};
