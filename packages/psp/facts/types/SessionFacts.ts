import type { Channel } from './Channel.ts';
import type { Currency } from './Currency.ts';
import type { InstrumentDetail } from './InstrumentDetail.ts';
import type { InstrumentId, Rail } from './InstrumentId.ts';
import type { Allocation } from './Split.ts';

// Facts of the `session` boundary — the bridges of one attempt to pay (key: sessionId). A bridge carries
// what its projections need, so that every view, and every webhook, can be formed from it alone.

/** `session.Opened` — the door, by the payer: an attempt to pay an invoice begins. */
export type SessionOpened = {
  sessionId: string;
  invoiceId: string;
  orderId: string;
  unitId: string;
  merchantId: string;
  amountMinor: number;
  currency: Currency;
  channel: Channel;
  locale: string;
  country: string;
  expiresAt: string;
};

/** `instrument.Chosen` — the door, by the payer: which instrument carries this attempt. */
export type InstrumentChosen = {
  sessionId: string;
  instrument: InstrumentId;
  detail: InstrumentDetail;
};

/** `risk.Scored` — the figure: the screening of this attempt, with its reasons. */
export type RiskScored = {
  sessionId: string;
  score: number;
  level: 'low' | 'medium' | 'high';
  reasons: string[];
  decision: 'pass' | 'review' | 'block';
};

/** `review.Opened` — the figure: the attempt waits for a compliance officer. */
export type ReviewOpened = {
  sessionId: string;
  alertId: string;
  reason: string;
};

/** `review.Cleared` — the door, by a compliance officer: the attempt may go on. */
export type ReviewCleared = {
  sessionId: string;
  alertId: string;
  by: string;
};

/** `review.Rejected` — the door, by a compliance officer: the attempt stops here. */
export type ReviewRejected = {
  sessionId: string;
  alertId: string;
  by: string;
  reason: string;
};

/** `route.Chosen` — the figure: the rail and the acquirer or bank that carry the attempt, and the rule that chose them. */
export type RouteChosen = {
  sessionId: string;
  rail: Rail;
  acquirer: string;
  rule: string;
};

/** `authentication.Challenged` — the world (issuer's ACS, a bank): the payer must prove it is them. */
export type AuthenticationChallenged = {
  sessionId: string;
  method: '3ds' | 'otp' | 'biometric';
};

/** `authentication.Passed` — the world: the payer proved it; `exemption` when no challenge was needed. */
export type AuthenticationPassed = {
  sessionId: string;
  method: '3ds' | 'otp' | 'biometric' | 'frictionless';
  exemption: 'low_value' | 'trusted_merchant' | 'low_risk' | null;
};

/** `authentication.Failed` — the world: the payer could not prove it. */
export type AuthenticationFailed = {
  sessionId: string;
  method: '3ds' | 'otp' | 'biometric';
  reason: string;
};

/** `token.Verified` — the world (a wallet): the device's cryptogram is valid; the payer approved on the device. */
export type TokenVerified = {
  sessionId: string;
  wallet: 'apple_pay' | 'google_pay';
};

/** `consent.Granted` — the world (a bank, a lender, a wallet): the payer approved in their own app. */
export type ConsentGranted = {
  sessionId: string;
  by: string;
};

/** `transfer.Instructed` — the figure: the payer is given an account and a reference to pay to. */
export type TransferInstructed = {
  sessionId: string;
  iban: string;
  reference: string;
};

/** `qr.Issued` — the figure: a QR code (NBU standard) carries the amount and the reference. */
export type QrIssued = {
  sessionId: string;
  reference: string;
};

/** `qr.Scanned` — the world (the payer's banking app): the code was read and the transfer confirmed. */
export type QrScanned = {
  sessionId: string;
  bank: string;
};

/** `voucher.Issued` — the figure: a code to pay with cash at a kiosk or a cash desk. */
export type VoucherIssued = {
  sessionId: string;
  code: string;
  expiresAt: string;
};

/** `voucher.Paid` — the world (a kiosk network): cash was paid against the code. */
export type VoucherPaid = {
  sessionId: string;
  network: string;
};

/** `mandate.Signed` — the door, by the payer: a direct-debit mandate. */
export type MandateSigned = {
  sessionId: string;
  mandateRef: string;
};

/** `collection.Submitted` — the figure: the debit was sent to the payer's bank; funds are expected. */
export type CollectionSubmitted = {
  sessionId: string;
  expectedAt: string;
};

/** `address.Issued` — the figure: an address on a chain to send stablecoins to. */
export type AddressIssued = {
  sessionId: string;
  network: string;
  address: string;
};

/** `chain.Seen` — the world (the chain): the transfer is seen, not yet final. */
export type ChainSeen = {
  sessionId: string;
  txHash: string;
};

/** `confirmations.Reached` — the world: the transfer has enough confirmations to be final. */
export type ConfirmationsReached = {
  sessionId: string;
  confirmations: number;
};

/** `credit.Approved` — the world (a lender): instalments or pay-later approved; the merchant is paid in full. */
export type CreditApproved = {
  sessionId: string;
  provider: string;
  parts: number;
};

/** `credit.Declined` — the world (a lender): no credit for this attempt. */
export type CreditDeclined = {
  sessionId: string;
  provider: string;
  reason: string;
};

/**
 * `authorisation.Approved` — the world (an issuer, through the acquirer): the funds are held. A payment
 * is born here: the bridge carries everything the payment's view needs.
 */
export type AuthorisationApproved = {
  sessionId: string;
  paymentId: string;
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
  authCode: string;
  captureMode: 'auto' | 'manual';
};

/** `authorisation.Declined` — the world: the issuer or the provider refused. No money moved. */
export type AuthorisationDeclined = {
  sessionId: string;
  code: string;
  reason: string;
};

/** `authorisation.Expired` — the world (the clock): a hold nobody captured lapsed. The money returns to the payer. */
export type AuthorisationExpired = {
  sessionId: string;
  paymentId: string;
  orderId: string;
};

/**
 * `funds.Received` — the world (a bank statement, a rail, a chain, a kiosk network): pushed money
 * arrived. For push instruments a payment is born here.
 */
export type FundsReceived = {
  sessionId: string;
  paymentId: string;
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
  via: 'statement' | 'rail' | 'chain' | 'kiosk' | 'lender';
  captureMode: 'auto' | 'manual';
};

/**
 * `funds.Mismatched` — the figure, as a guard: money arrived that the invoice does not explain. The attempt
 * is held, with an alert, until a person decides: take what arrived (no more than was due), or return it.
 */
export type FundsMismatched = {
  sessionId: string;
  alertId: string;
  expectedMinor: number;
  gotMinor: number;
  reason: 'amount' | 'currency' | 'reference' | 'duplicate';
};

/** `capture.Requested` — the door, by an operator: take the held funds (manual capture, at shipment). */
export type CaptureRequested = {
  sessionId: string;
  paymentId: string;
  amountMinor: number;
  by: string;
};

/** `capture.Voided` — the door, by an operator: release a hold instead of taking it. */
export type CaptureVoided = {
  sessionId: string;
  paymentId: string;
  orderId: string;
  by: string;
  reason: string;
};

/** `conversion.Completed` — the world (a liquidity provider): stablecoins converted to the invoice's currency. */
export type ConversionCompleted = {
  sessionId: string;
  rate: string;
  fiatMinor: number;
};

/**
 * `capture.Completed` — the world (the acquirer) or the figure (for pushed money): the money is taken.
 * Here the invoice and the order become paid. `feeMinor` is the PSP's fee from the merchant's tariff.
 */
export type CaptureCompleted = {
  sessionId: string;
  paymentId: string;
  invoiceId: string;
  orderId: string;
  merchantId: string;
  acquirer: string;
  amountMinor: number;
  currency: Currency;
  feeMinor: number;
};

/** `split.Allocated` — the figure: the delta — who receives how much of the captured amount. Sums to the amount. */
export type SplitAllocated = {
  sessionId: string;
  paymentId: string;
  orderId: string;
  acquirer: string;
  amountMinor: number;
  currency: Currency;
  allocations: Allocation[];
};

/** `receipt.Issued` — the figure: what the payer receives back. */
export type ReceiptIssued = {
  sessionId: string;
  receiptId: string;
  invoiceId: string;
  orderId: string;
  paymentId: string;
  amountMinor: number;
  currency: Currency;
};

/** `session.Succeeded` — the figure: the attempt reached the mouth. */
export type SessionSucceeded = {
  sessionId: string;
  invoiceId: string;
  paymentId: string;
};

/** `session.Failed` — the figure: the attempt ended without money; the invoice stays payable. */
export type SessionFailed = {
  sessionId: string;
  invoiceId: string;
  code: string;
  reason: string;
};

/** `session.Abandoned` — the world (the clock): the payer left and did not come back. */
export type SessionAbandoned = {
  sessionId: string;
  invoiceId: string;
};

/** `session.Expired` — the world (the clock): the attempt outlived its time (a voucher, a transfer that never came). */
export type SessionExpired = {
  sessionId: string;
  invoiceId: string;
};
