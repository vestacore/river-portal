import type { FulfilmentAccepted, FulfilmentDelivered, FulfilmentShipped, OrderCancelled, OrderCreated } from './OrderFacts.ts';
import type { InvoiceIssued, InvoiceReminded, InvoiceSent, InvoiceViewed, InvoiceVoided } from './InvoiceFacts.ts';
import type {
  AddressIssued, AuthenticationChallenged, AuthenticationFailed, AuthenticationPassed, AuthorisationApproved, AuthorisationDeclined,
  AuthorisationExpired, CaptureCompleted, CaptureRequested, CaptureVoided, ChainSeen, CollectionSubmitted, ConfirmationsReached,
  ConsentGranted, ConversionCompleted, CreditApproved, CreditDeclined, FundsMismatched, FundsReceived, InstrumentChosen, MandateSigned,
  QrIssued, QrScanned, ReceiptIssued, ReviewCleared, ReviewOpened, ReviewRejected, RiskScored, RouteChosen, SessionAbandoned,
  SessionExpired, SessionFailed, SessionOpened, SessionSucceeded, SplitAllocated, TokenVerified, TransferInstructed, VoucherIssued, VoucherPaid,
} from './SessionFacts.ts';
import type { DisputeEvidenced, DisputeLost, DisputeOpened, DisputeWon, PayoutSent, RefundCompleted, RefundFailed, RefundRequested } from './PaymentFacts.ts';

/** Every fact type of the PSP and the shape of its payload. The fact catalogue says who owns each. */
export type PayloadMap = {
  'order.Created': OrderCreated;
  'order.Cancelled': OrderCancelled;
  'fulfilment.Accepted': FulfilmentAccepted;
  'fulfilment.Shipped': FulfilmentShipped;
  'fulfilment.Delivered': FulfilmentDelivered;
  'invoice.Issued': InvoiceIssued;
  'invoice.Sent': InvoiceSent;
  'invoice.Viewed': InvoiceViewed;
  'invoice.Reminded': InvoiceReminded;
  'invoice.Voided': InvoiceVoided;
  'session.Opened': SessionOpened;
  'instrument.Chosen': InstrumentChosen;
  'risk.Scored': RiskScored;
  'review.Opened': ReviewOpened;
  'review.Cleared': ReviewCleared;
  'review.Rejected': ReviewRejected;
  'route.Chosen': RouteChosen;
  'authentication.Challenged': AuthenticationChallenged;
  'authentication.Passed': AuthenticationPassed;
  'authentication.Failed': AuthenticationFailed;
  'token.Verified': TokenVerified;
  'consent.Granted': ConsentGranted;
  'transfer.Instructed': TransferInstructed;
  'qr.Issued': QrIssued;
  'qr.Scanned': QrScanned;
  'voucher.Issued': VoucherIssued;
  'voucher.Paid': VoucherPaid;
  'mandate.Signed': MandateSigned;
  'collection.Submitted': CollectionSubmitted;
  'address.Issued': AddressIssued;
  'chain.Seen': ChainSeen;
  'confirmations.Reached': ConfirmationsReached;
  'credit.Approved': CreditApproved;
  'credit.Declined': CreditDeclined;
  'authorisation.Approved': AuthorisationApproved;
  'authorisation.Declined': AuthorisationDeclined;
  'authorisation.Expired': AuthorisationExpired;
  'funds.Received': FundsReceived;
  'funds.Mismatched': FundsMismatched;
  'capture.Requested': CaptureRequested;
  'capture.Voided': CaptureVoided;
  'conversion.Completed': ConversionCompleted;
  'capture.Completed': CaptureCompleted;
  'split.Allocated': SplitAllocated;
  'receipt.Issued': ReceiptIssued;
  'session.Succeeded': SessionSucceeded;
  'session.Failed': SessionFailed;
  'session.Abandoned': SessionAbandoned;
  'session.Expired': SessionExpired;
  'refund.Requested': RefundRequested;
  'refund.Completed': RefundCompleted;
  'refund.Failed': RefundFailed;
  'dispute.Opened': DisputeOpened;
  'dispute.Evidenced': DisputeEvidenced;
  'dispute.Won': DisputeWon;
  'dispute.Lost': DisputeLost;
  'payout.Sent': PayoutSent;
};

export type FactType = keyof PayloadMap;
