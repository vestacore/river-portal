import type { OrderLine } from '@river/psp-facts';
import type { Origin } from '@river/stream';
import { appendFacts } from './appendFacts.ts';
import type { World } from './types/World.ts';

/**
 * The merchant's order system reports an order picked: the lines as picked — weighed goods at their weight,
 * missing items taken off, substitutes in their place — and the total to charge. The order records it; the
 * invoice's claim follows the picked total before anything is captured.
 */
export function recordPicking(world: World, orderId: string, picked: { lines: OrderLine[]; changes: Array<{ sku: string; kind: 'weight' | 'missing' | 'substitute'; deltaMinor: number }> }, origin: Origin, at: string): { totalMinor: number } | { error: string } {
  const order = world.views.orders.get(orderId);
  if (!order) return { error: 'not_found' };
  if (order.picked) return { error: 'already picked' };
  const totalMinor = picked.lines.reduce((s, l) => s + l.totalMinor, 0);
  appendFacts(world, orderId, [{ type: 'fulfilment.Picked', payload: { orderId, lines: picked.lines, totalMinor, orderedMinor: order.totalMinor, changes: picked.changes } }], origin, at);
  for (const invoiceId of order.invoiceIds) {
    const invoice = world.views.invoices.get(invoiceId);
    if (!invoice || invoice.voided || invoice.amountMinor === totalMinor) continue;
    appendFacts(world, invoiceId, [{ type: 'invoice.Adjusted', payload: { invoiceId, orderId, amountMinor: totalMinor, previousMinor: invoice.amountMinor, reason: 'picked' } }], { via: 'figure', by: 'invoice' }, at);
  }
  return { totalMinor };
}
