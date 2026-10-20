import type { Allocation, Currency, InstrumentDetail, InstrumentId, Rail } from '@river/psp-facts';
import type { PaymentStatus } from './PaymentStatus.ts';

export type RefundLine = { refundId: string; amountMinor: number; reason: string; by: string; status: 'requested' | 'completed' | 'failed'; requestedAt: string; closedAt: string | null };
export type DisputeLine = { disputeId: string; amountMinor: number; reason: string; respondBy: string; status: 'open' | 'evidenced' | 'won' | 'lost'; openedAt: string; closedAt: string | null };
export type PayoutLine = { batchId: string; rule: number; recipientUnitId: string; amountMinor: number; at: string };

/**
 * The payment as the cabinets read it. It is born at a bridge of its session (`authorisation.Approved`
 * or `funds.Received`), becomes money at the capture, is distributed by the split, and lives on in its
 * own stream: refunds, disputes, payouts.
 */
export type PaymentView = {
  paymentId: string;
  sessionId: string;
  invoiceId: string;
  orderId: string;
  unitId: string;
  merchantId: string;
  instrument: InstrumentId;
  detail: InstrumentDetail;
  rail: Rail;
  acquirer: string;
  amountMinor: number;
  currency: Currency;
  captureMode: 'auto' | 'manual';
  authCode: string | null;
  via: string | null;
  createdAt: string;
  updatedAt: string;
  capturedAt: string | null;
  capturedMinor: number;
  feeMinor: number;
  refundedMinor: number;
  chargebackMinor: number;
  allocations: Allocation[];
  refunds: RefundLine[];
  disputes: DisputeLine[];
  payouts: PayoutLine[];
  status: PaymentStatus;
};
