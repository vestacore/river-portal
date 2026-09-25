import type { CostKind } from './CostKind.ts';

/** Payload of `costRecord.Submitted` and (subset) `costRecord.Approved`. Aggregated costs are public (P8). */
export type CostSubmittedPayload = {
  flowId: string;
  campaignId: string | null;
  kind: CostKind;
  amountMinor: number;
  currency: string;
  fxRate: number;
  reportingCurrency: string;
  reportingMinor: number;
  note: string;
};
