import { settle } from '@river/figure';
import { requestCancellation } from '@river/pay-acts';
import { payFacts } from '@river/pay-facts';
import { payViewPaths, type OrderView } from '@river/pay-views';
import type { PayRuntime } from './types/PayRuntime.ts';

/**
 * Time enters the river as a fact: for an invoice past its date the clock asks for the order to be
 * withdrawn. It only asks — the figure decides inside the wave, and refuses while an attempt is
 * under way, because an invoice does not expire under a payer who is paying it. So what the clock
 * read a moment ago cannot cancel what has happened since. With `orderId`, only that order is
 * looked at. Returns how many orders were withdrawn.
 */
export async function expireDue(runtime: PayRuntime, at: Date = new Date(), orderId?: string): Promise<number> {
  const { store, root, assembly } = runtime;
  const now = at.toISOString();
  const waiting: OrderView[] = orderId
    ? [await store.get<OrderView>(payViewPaths.order(root, orderId))].filter((view): view is OrderView => view !== null)
    : (await store.query<OrderView>(payViewPaths.orders(root), { where: [{ field: 'status', op: 'in', value: ['invoiced', 'retry', 'refused'] }] })).map(({ id: _id, ...view }) => view as OrderView);
  let expired = 0;
  for (const view of waiting) {
    if (!['invoiced', 'retry', 'refused'].includes(view.status) || !view.invoice || view.invoice.expiresAt > now) continue;
    const receipt = await settle(store, root, assembly, {
      stream: view.orderId,
      at: now,
      entering: [{ draft: requestCancellation('the invoice expired', 'underWay'), origin: { via: 'world', controller: 'clock', answering: null }, causedBy: null }],
    });
    if (receipt.facts.some((fact) => fact.type === payFacts.orderCancelled)) expired += 1;
  }
  return expired;
}
