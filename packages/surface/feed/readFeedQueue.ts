import type { DocStore } from '@river/store';
import { feedPaths } from './paths.ts';
import type { FeedItem } from './types/FeedItem.ts';

/** Feed items for the studio, newest first. */
export async function readFeedQueue(store: DocStore, orgId: string): Promise<FeedItem[]> {
  return store.query<FeedItem>(feedPaths.items(orgId), { orderBy: { field: 'createdAt', direction: 'desc' }, limit: 200 });
}
