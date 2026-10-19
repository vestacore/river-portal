import { riverOf, type RiverRow } from '@river/pay-views';
import { readStream } from '@river/stream';
import { isOrderId } from './isOrderId.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/** The whole stream of one order, as rows to read — from its source to wherever it stands now. */
export async function readRiver(runtime: PayRuntime, orderId: string): Promise<RiverRow[]> {
  if (!isOrderId(orderId)) return [];
  return riverOf(await readStream(runtime.store, runtime.root, orderId));
}
