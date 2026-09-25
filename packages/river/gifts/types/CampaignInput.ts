import type { LocalisedText } from '@river/i18n';

export type CampaignInput = {
  title: LocalisedText;
  summary: LocalisedText;
  goalMinor: number;
  currency: string;
  slug?: string;
};
