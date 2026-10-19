import type { DocStore } from '@river/store';
import { payViewPaths } from './paths.ts';
import type { OrderView } from './types/OrderView.ts';

/** The orders addressed to one payer handle, newest first. */
export async function readPayerOrders(store: DocStore, root: string, payerRef: string): Promise<OrderView[]> {
  const rows = await store.query<OrderView>(payViewPaths.orders(root), { where: [{ field: 'payerRef', op: '==', value: payerRef }] });
  return rows.map(({ id: _id, ...view }) => view as OrderView).sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}
