export const campaignStatuses = ['active', 'paused', 'closed'] as const;
export type CampaignStatus = (typeof campaignStatuses)[number];
