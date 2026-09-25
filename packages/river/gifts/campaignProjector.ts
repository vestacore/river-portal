import type { LogEvent, Projector } from '@river/log';
import { giftPaths } from './paths.ts';
import type { Campaign } from './types/Campaign.ts';
import type { CampaignLaunchedPayload } from './types/CampaignLaunchedPayload.ts';
import type { Gift } from './types/Gift.ts';
import type { GiftPledgedPayload } from './types/GiftPledgedPayload.ts';

async function project(event: LogEvent, tx: Parameters<Projector['project']>[1]): Promise<void> {
  if (event.type === 'campaign.Launched') {
    const p = event.payload as CampaignLaunchedPayload;
    const campaign: Campaign = {
      id: event.aggregate.id, ...p, pledgedMinor: 0, receivedMinor: 0, giftsCount: 0,
      status: 'active', launchedAt: event.occurredAt, updatedAt: event.occurredAt,
    };
    tx.set(giftPaths.campaign(event.orgId, event.aggregate.id), campaign);
    return;
  }
  const campaignId =
    event.type === 'gift.Pledged'
      ? (event.payload as GiftPledgedPayload).campaignId
      : (await tx.get<Gift>(giftPaths.gift(event.orgId, event.aggregate.id)))?.campaignId;
  if (!campaignId) return;
  const path = giftPaths.campaign(event.orgId, campaignId);
  const campaign = await tx.get<Campaign>(path);
  if (!campaign) return;
  if (event.type === 'gift.Pledged') {
    const p = event.payload as GiftPledgedPayload;
    campaign.giftsCount += 1;
    if (p.currency === campaign.currency && p.amountMinor) campaign.pledgedMinor += p.amountMinor;
  } else {
    const gift = await tx.get<Gift>(giftPaths.gift(event.orgId, event.aggregate.id));
    if (gift?.currency === campaign.currency && gift.amountMinor) campaign.receivedMinor += gift.amountMinor;
  }
  campaign.updatedAt = event.occurredAt;
  tx.set(path, campaign);
}

/** Keeps campaign totals: pledged, received and number of gifts. */
export const campaignProjector: Projector = { name: 'campaigns', handles: ['campaign.Launched', 'gift.Pledged', 'gift.Received'], project };
