import type { Currency, FactType, Projection, PspFact, Speaker, Stage } from '@river/psp-facts';

/** What one fact changed in one view: the fields that moved, from what to what. */
export type ProjectionDelta = {
  projection: Projection;
  key: string;
  created: boolean;
  changes: Array<{ field: string; from: unknown; to: unknown }>;
};

/** One bridge of a session's river, as drawn: where it stands, who spoke, and what it formed. */
export type BridgeRow = {
  seq: number;
  wave: number;
  type: FactType;
  stage: Stage | null;
  speaker: Speaker;
  origin: PspFact['origin'];
  causedBy: number | null;
  at: string;
  payload: Record<string, unknown>;
  formed: ProjectionDelta[];
};

export type DayPoint = { day: string; value: number };
export type StackPoint = { day: string; values: Record<string, number> };

/** The headline figures of a scope over a period, in one currency. */
export type Kpis = {
  currency: Currency;
  grossMinor: number;
  payments: number;
  averageMinor: number;
  sessions: number;
  succeeded: number;
  conversionBps: number;
  approvalBps: number;
  refundedMinor: number;
  refundBps: number;
  disputes: number;
  feeMinor: number;
};

/** A payout batch: one recipient, one day, one currency — the shares many payments sent together. */
export type PayoutBatch = {
  batchId: string;
  recipientUnitId: string;
  currency: Currency;
  amountMinor: number;
  payments: number;
  at: string;
};
