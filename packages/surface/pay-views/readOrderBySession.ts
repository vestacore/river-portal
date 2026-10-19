import type { DocStore } from '@river/store';
import { payViewPaths } from './paths.ts';
import type { OrderView } from './types/OrderView.ts';

/** The order whose open session has this reference, or null when that session is no longer the one under way. */
export async function readOrderBySession(store: DocStore, root: string, sessionRef: string): Promise<OrderView | null> {
  if (sessionRef.length === 0 || sessionRef.length > 200) return null;
  const [found] = await store.query<OrderView>(payViewPaths.orders(root), { where: [{ field: 'sessionRef', op: '==', value: sessionRef }], limit: 1 });
  if (!found) return null;
  const { id: _id, ...view } = found;
  return view as OrderView;
}
