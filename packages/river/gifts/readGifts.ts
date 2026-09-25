import type { DocStore } from '@river/store';
import { giftPaths } from './paths.ts';
import type { Gift } from './types/Gift.ts';
import type { GiftStatus } from './types/GiftStatus.ts';

/** Gifts for the studio, newest first, optionally only one status. */
export async function readGifts(store: DocStore, orgId: string, status?: GiftStatus): Promise<Gift[]> {
  return store.query<Gift>(giftPaths.gifts(orgId), {
    ...(status ? { where: [{ field: 'status', op: '==' as const, value: status }] } : {}),
    orderBy: { field: 'pledgedAt', direction: 'desc' },
    limit: 200,
  });
}
