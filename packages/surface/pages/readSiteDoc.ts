import type { DocStore } from '@river/store';
import { emptySiteDoc } from './emptySiteDoc.ts';
import { pagePaths } from './paths.ts';
import type { SiteDoc } from './types/SiteDoc.ts';

/** The site document: one read renders the home page and site chrome. */
export async function readSiteDoc(store: DocStore, orgId: string): Promise<SiteDoc> {
  return (await store.get<SiteDoc>(pagePaths.site(orgId))) ?? emptySiteDoc(orgId, new Date().toISOString());
}
