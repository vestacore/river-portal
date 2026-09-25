import type { CostKind } from './CostKind.ts';

/** One recorded cost of a flow. `gbpMinor` is the amount converted at `fxRateToGbp`. */
export type CostLine = {
  id: string;
  kind: CostKind;
  amountMinor: number;
  currency: string;
  fxRateToGbp: number;
  gbpMinor: number;
  note: string;
  status: 'submitted' | 'approved';
  at: string;
};
