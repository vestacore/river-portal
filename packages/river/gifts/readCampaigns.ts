import type { DocStore } from '@river/store';
import { giftPaths } from './paths.ts';
import type { Campaign } from './types/Campaign.ts';

/** All campaigns, newest first. */
export async function readCampaigns(store: DocStore, orgId: string): Promise<Campaign[]> {
  return store.query<Campaign>(giftPaths.campaigns(orgId), { orderBy: { field: 'launchedAt', direction: 'desc' } });
}
