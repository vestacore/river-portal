import type { LocalisedText } from '@river/i18n';

/** Campaign summary shown on the home page. */
export type CampaignCard = {
  id: string;
  slug: string;
  title: LocalisedText;
  summary: LocalisedText;
  goalMinor: number;
  currency: string;
  pledgedMinor: number;
  receivedMinor: number;
  spentGbpMinor: number;
  giftsCount: number;
  status: 'active' | 'paused' | 'closed';
};
