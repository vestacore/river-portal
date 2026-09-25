import type { DocStore } from '@river/store';
import { pagePaths } from './paths.ts';
import type { CampaignPage } from './types/CampaignPage.ts';

/** A public campaign page by slug. */
export async function readCampaignPage(store: DocStore, orgId: string, slug: string): Promise<CampaignPage | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  return store.get<CampaignPage>(pagePaths.campaign(orgId, slug));
}
