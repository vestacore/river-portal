import { hashToken } from '@river/kernel';
import type { DocStore } from '@river/store';
import { payViewPaths } from './paths.ts';
import type { OrderView } from './types/OrderView.ts';

/** The order a pay key opens — the invoice as a key. Only the key's hash is stored, so only the holder finds it. */
export async function readOrderByPayKey(store: DocStore, root: string, payKey: string): Promise<OrderView | null> {
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(payKey)) return null;
  const [found] = await store.query<OrderView>(payViewPaths.orders(root), { where: [{ field: 'payKeyHash', op: '==', value: hashToken(payKey) }], limit: 1 });
  if (!found) return null;
  const { id: _id, ...view } = found;
  return view as OrderView;
}
