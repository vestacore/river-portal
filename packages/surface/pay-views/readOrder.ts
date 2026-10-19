import type { DocStore } from '@river/store';
import { payViewPaths } from './paths.ts';
import type { OrderView } from './types/OrderView.ts';

/** One order's view, or null. */
export function readOrder(store: DocStore, root: string, orderId: string): Promise<OrderView | null> {
  return store.get<OrderView>(payViewPaths.order(root, orderId));
}
