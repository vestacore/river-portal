import { defineJoiner } from '@river/figure';
import { payFacts, type LedgerPosted, type OrderPaid, type PaymentMismatched, type ReceiptIssued } from '@river/pay-facts';
import { capturePostings } from '@river/pay-ledger';
import type { MouthState } from './types/MouthState.ts';
import type { OrderNeedState } from './types/OrderNeedState.ts';

/**
 * The mouth, crossed once. The capture is checked against the invoice before anything is settled:
 * it must come from a session this order opened, in the invoice's currency, for the invoice's
 * amount, and the order must still stand. If it does — a balanced entry, the order paid, a receipt.
 * If it does not — a flag and nothing else: an operator decides what unexplained money means.
 */
export const settleOrder = defineJoiner<{ order: OrderNeedState; mouth: MouthState }>({
  id: 'settleOrder',
  demands: { order: 'orderNeed', mouth: 'mouth' },
  emit: ({ order: { order }, mouth: { invoice, capture, sessions, cancelled } }) => {
    if (!order || !invoice || !capture) return [];
    const reason: PaymentMismatched['reason'] | null = cancelled ? 'cancelled'
      : !sessions.includes(capture.sessionRef) ? 'session'
      : capture.currency !== invoice.currency ? 'currency'
      : capture.amountMinor !== invoice.amountMinor ? 'amount'
      : null;
    if (reason) {
      const mismatch: PaymentMismatched = { reason, providerRef: capture.providerRef, expectedMinor: invoice.amountMinor, expectedCurrency: invoice.currency, gotMinor: capture.amountMinor, gotCurrency: capture.currency };
      return [{ type: payFacts.paymentMismatched, payload: mismatch }];
    }
    const posted: LedgerPosted = { postings: capturePostings({ merchantId: order.merchantId, provider: capture.provider, amountMinor: invoice.amountMinor, feeMinor: invoice.feeMinor, currency: invoice.currency }) };
    const paid: OrderPaid = { provider: capture.provider, providerRef: capture.providerRef, amountMinor: invoice.amountMinor, feeMinor: invoice.feeMinor, netMinor: invoice.netMinor, currency: invoice.currency };
    const receipt: ReceiptIssued = { receiptId: `rcpt-${order.orderId}`, payerRef: order.payerRef, amountMinor: invoice.amountMinor, currency: invoice.currency };
    return [{ type: payFacts.ledgerPosted, payload: posted }, { type: payFacts.orderPaid, payload: paid }, { type: payFacts.receiptIssued, payload: receipt }];
  },
});
