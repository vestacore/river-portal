import type { DocStore } from '@river/store';
import { feedPaths } from './paths.ts';
import type { FeedItem } from './types/FeedItem.ts';

/** One feed item (team view). */
export async function readFeedItem(store: DocStore, orgId: string, itemId: string): Promise<FeedItem | null> {
  return store.get<FeedItem>(feedPaths.item(orgId, itemId));
}
