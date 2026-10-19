import { hashToken } from '@river/kernel';
import { readOrderBySession, type OrderView } from '@river/pay-views';
import type { PayRuntime } from './types/PayRuntime.ts';

/**
 * The order behind a stand-in's open session, for the payer whose session it is and for nobody
 * else. A stand-in's session reference can be worked out from an order's id, so the reference alone
 * opens nothing: the reader must hold the order's pay key, or be the payer the order is addressed to.
 * Null also when the session was opened by a real provider, or that provider is no longer a stand-in.
 */
export async function readStandInSession(runtime: PayRuntime, sessionRef: string, by: { payKey: string } | { payerRef: string }): Promise<OrderView | null> {
  const view = await readOrderBySession(runtime.store, runtime.root, sessionRef);
  const session = view?.session;
  if (!view || !session || !session.simulated || runtime.config[session.provider].mode !== 'simulated') return null;
  const theirs = 'payKey' in by ? hashToken(by.payKey) === view.payKeyHash : by.payerRef === view.payerRef;
  return theirs ? view : null;
}
