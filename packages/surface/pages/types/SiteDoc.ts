import type { PublicFeedItem } from '@river/feed';
import type { BlockMap } from '@river/content';
import type { CampaignCard } from './CampaignCard.ts';
import type { Counters } from './Counters.ts';
import type { GratitudeCard } from './GratitudeCard.ts';
import type { ReportCard } from './ReportCard.ts';

/**
 * The site document (`public/{org}`): everything the home page and site chrome need, in one read
 * (ADR-0012). Public data only.
 */
export type SiteDoc = {
  orgId: string;
  counters: Counters;
  campaigns: CampaignCard[];
  feed: PublicFeedItem[];
  reports: ReportCard[];
  gratitude: GratitudeCard[];
  blocks: BlockMap;
  updatedAt: string;
};
