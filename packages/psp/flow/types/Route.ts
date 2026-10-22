/** How a unit chooses an acquirer (the `routing.strategy` policy). */
export type RouteStrategy = 'approval_first' | 'least_cost' | 'on_us_first';

/** One acquirer's expected fee for an attempt under the merchant's terms, and whether the card is its own bank's. */
export type RouteQuote = { acquirer: string; feeMinor: number | null; onUs: boolean };

/** The routing decision, with every acquirer considered. */
export type RouteChoice = {
  acquirer: string;
  rule: string;
  onUs: boolean;
  feeMinor: number | null;
  alternatives: Array<{ acquirer: string; feeMinor: number | null; approvalBps: number; onUs: boolean; eligible: boolean }>;
};
