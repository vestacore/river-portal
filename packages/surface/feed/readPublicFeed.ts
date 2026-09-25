import type { DocStore } from '@river/store';
import { feedPaths } from './paths.ts';
import type { PublicFeedItem } from './types/PublicFeedItem.ts';

/** Published feed items, newest first. */
export async function readPublicFeed(store: DocStore, orgId: string, limit = 30): Promise<PublicFeedItem[]> {
  return store.query<PublicFeedItem>(feedPaths.publicItems(orgId), { orderBy: { field: 'publishedAt', direction: 'desc' }, limit });
}
