import type { CostKind } from '@river/flows';
import type { CampaignCard } from './CampaignCard.ts';
import type { ReportCard } from './ReportCard.ts';

/** A campaign page (`public/{org}/campaigns/{slug}`) with its open cost breakdown. */
export type CampaignPage = CampaignCard & {
  costBreakdown: Partial<Record<CostKind, number>>;
  deliveries: number;
  reports: ReportCard[];
  launchedAt: string;
  updatedAt: string;
};
