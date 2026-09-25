import type { CostKind } from './CostKind.ts';

/** One recorded cost of a flow. `reportingMinor` is the amount converted at `fxRate` into the reporting currency. */
export type CostLine = {
  id: string;
  kind: CostKind;
  amountMinor: number;
  currency: string;
  fxRate: number;
  reportingCurrency: string;
  reportingMinor: number;
  note: string;
  status: 'submitted' | 'approved';
  at: string;
};
