import type { CostKind } from '@river/flows';
import type { RecipientKind } from '@river/privacy';

/**
 * Facts behind a report, derived from the log. Pseudonymised: only oblast level, recipient kind and
 * counts. `gratitude` is present only when the recipient chose to show their thanks publicly.
 */
export type ReportFacts = {
  flowId: string;
  campaignId: string | null;
  oblastId: string;
  recipients: Array<{ kind: RecipientKind; householdSize: number | null }>;
  categoryIds: string[];
  giftsCount: number;
  /** Reporting currency at the time of the report; all money below is in its minor units. */
  currency: string;
  moneyMinor: number;
  costsMinor: number;
  costBreakdown: Partial<Record<CostKind, number>>;
  carrierKind: string | null;
  fromLabel: string | null;
  dispatchedAt: string | null;
  arrivedAt: string | null;
  confirmedAt: string | null;
  gratitude: { text: string; locale: string } | null;
};
