import type { DocStore } from '@river/store';
import { payViewPaths } from './paths.ts';
import type { OrderView } from './types/OrderView.ts';

/** A merchant's orders, newest first. Sorted here, so the store needs no composite index. */
export async function readMerchantOrders(store: DocStore, root: string, merchantId: string): Promise<OrderView[]> {
  const rows = await store.query<OrderView>(payViewPaths.orders(root), { where: [{ field: 'merchantId', op: '==', value: merchantId }] });
  return rows.map(({ id: _id, ...view }) => view as OrderView).sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}
