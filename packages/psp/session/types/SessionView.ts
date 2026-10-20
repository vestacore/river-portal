import type { Channel, Currency, FactType, InstrumentDetail, InstrumentId, Rail, Stage } from '@river/psp-facts';
import type { SessionOutcome } from './SessionOutcome.ts';

/** The attempt as the cabinets read it: a fold of its own stream — its bridges — and nothing else. */
export type SessionView = {
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
  openedAt: string;
  updatedAt: string;
  closedAt: string | null;
  expiresAt: string;
  stage: Stage;
  reached: Stage[];
  outcome: SessionOutcome;
  instrument: InstrumentId | null;
  detail: InstrumentDetail | null;
  risk: { score: number; level: 'low' | 'medium' | 'high'; reasons: string[]; decision: 'pass' | 'review' | 'block' } | null;
  review: { alertId: string; reason: string; status: 'open' | 'cleared' | 'rejected'; by: string | null } | null;
  route: { rail: Rail; acquirer: string; rule: string } | null;
  consent: FactType | null;
  paymentId: string | null;
  captureMode: 'auto' | 'manual' | null;
  capturedMinor: number;
  feeMinor: number;
  receiptId: string | null;
  failure: { code: string; reason: string } | null;
  /** What arrived against what was due, when pushed money did not match (and until a person took it). */
  mismatch: { expectedMinor: number; gotMinor: number } | null;
  bridges: number;
  last: FactType;
};
