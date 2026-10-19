import { cookies } from 'next/headers';
import { getPayRuntime, readStandInSession } from '@river/pay-runtime';
import type { OrderView } from '@river/pay-views';
import { getPayActor } from './getPayActor';

/**
 * A stand-in's open session, if it is this visitor's own: either this browser kept the order's pay
 * key when it opened the gate, or the visitor is signed in as the payer the order is addressed to.
 * Returns the order and the authority that opened it, to be shown to the door again; null otherwise.
 */
export async function ownStandIn(sessionRef: string): Promise<{ view: OrderView; by: { payKey: string } | { payerRef: string } } | null> {
  const runtime = await getPayRuntime();
  const [, key] = ((await cookies()).get('river-pay-return')?.value ?? '').split(':');
  const actor = await getPayActor();
  const held: Array<{ payKey: string } | { payerRef: string }> = [...(key ? [{ payKey: key }] : []), ...(actor?.role === 'payer' ? [{ payerRef: actor.ref }] : [])];
  for (const by of held) {
    const view = await readStandInSession(runtime, sessionRef, by);
    if (view) return { view, by };
  }
  return null;
}
