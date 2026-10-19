import type { DocStore } from '@river/store';
import { payViewPaths } from './paths.ts';
import type { OrderView } from './types/OrderView.ts';

/**
 * Every order that has an entry in the ledger — all of them, with no limit: a ledger summed over
 * "the latest few hundred" would balance and still be wrong.
 */
export async function readPostedOrders(store: DocStore, root: string): Promise<OrderView[]> {
  const rows = await store.query<OrderView>(payViewPaths.orders(root), { where: [{ field: 'posted', op: '==', value: true }] });
  return rows.map(({ id: _id, ...view }) => view as OrderView).sort((a, b) => a.placedAt.localeCompare(b.placedAt));
}
