import type { LocalisedText } from '@river/i18n';
import type { CampaignStatus } from './CampaignStatus.ts';

/** Team view of a campaign (`orgs/{org}/campaigns/{id}`); money in minor units of `currency`. */
export type Campaign = {
  id: string;
  slug: string;
  title: LocalisedText;
  summary: LocalisedText;
  goalMinor: number;
  currency: string;
  pledgedMinor: number;
  receivedMinor: number;
  giftsCount: number;
  status: CampaignStatus;
  launchedAt: string;
  updatedAt: string;
};
