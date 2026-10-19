import type { DocStore } from '@river/store';
import { payViewPaths } from './paths.ts';
import type { OrderView } from './types/OrderView.ts';

/** The orders of the river, newest first, up to `limit` — the operator's list. The ledger does not use it. */
export async function readAllOrders(store: DocStore, root: string, limit = 500): Promise<OrderView[]> {
  const rows = await store.query<OrderView>(payViewPaths.orders(root), { orderBy: { field: 'placedAt', direction: 'desc' }, limit });
  return rows.map(({ id: _id, ...view }) => view as OrderView);
}
