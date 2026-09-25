import type { DocStore } from '@river/store';
import { giftPaths } from './paths.ts';
import type { Gift } from './types/Gift.ts';

/** Gifts of one signed-in giver, newest first ("my giving"). */
export async function readGiftsByGiver(store: DocStore, orgId: string, giverId: string): Promise<Gift[]> {
  const rows = await store.query<Gift>(giftPaths.gifts(orgId), { where: [{ field: 'giverId', op: '==', value: giverId }] });
  return rows.sort((a, b) => b.pledgedAt.localeCompare(a.pledgedAt));
}
