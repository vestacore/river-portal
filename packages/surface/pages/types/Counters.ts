import type { CostKind } from '@river/flows';

/** Public counters on the home page. Money in minor units of the reporting currency. */
export type Counters = {
  needsReceived: number;
  needsConfirmed: number;
  households: number;
  deliveries: number;
  giftsPledged: number;
  moneyReceivedMinor: number;
  costsMinor: number;
  costBreakdown: Partial<Record<CostKind, number>>;
  gratitudeNotes: number;
  lastConfirmedAt: string | null;
};
