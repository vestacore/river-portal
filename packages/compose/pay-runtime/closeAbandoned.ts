import { settle } from '@river/figure';
import { payFacts, type ProviderSessionExpired } from '@river/pay-facts';
import { payViewPaths, type OrderView } from '@river/pay-views';
import { payDefaults } from './data/payDefaults.ts';
import { safeKey } from './safeKey.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/**
 * A provider's page that the payer never completed is closed by the clock, once it has been open
 * longer than a session lives: not every provider says when a page was abandoned, and an attempt
 * nobody ends would hold the order for ever. The clock says so once for each session, as a fact;
 * the figure ends the attempt only if nothing is being collected in it, and the payer may then ask
 * again. If the payer completes the old page after all, the money is still recognised by the mouth.
 */
export async function closeAbandoned(runtime: PayRuntime, at: Date = new Date()): Promise<number> {
  const { store, root, assembly, config } = runtime;
  const before = new Date(at.getTime() - (config.sessionTtlMinutes + payDefaults.sessionGraceMinutes) * 60_000).toISOString();
  const open = await store.query<OrderView>(payViewPaths.orders(root), { where: [{ field: 'status', op: '==', value: 'open' }] });
  let closed = 0;
  for (const view of open) {
    const session = view.session;
    if (!session || session.openedAt > before) continue;
    const expired: ProviderSessionExpired = { provider: session.provider, sessionRef: session.sessionRef, reason: 'the session was not completed in time' };
    const receipt = await settle(store, root, assembly, {
      stream: view.orderId,
      at: at.toISOString(),
      actKey: safeKey('abandoned', session.sessionRef),
      entering: [{ draft: { type: payFacts.providerSessionExpired, payload: expired }, origin: { via: 'world', controller: 'clock', answering: null }, causedBy: null }],
    });
    if (!receipt.duplicate) closed += 1;
  }
  return closed;
}
