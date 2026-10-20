import { appendFacts } from './appendFacts.ts';
import type { World } from './types/World.ts';

const checkout = new Set(['web', 'app', 'pos', 'link', 'api']);

/**
 * The clock withdraws what a checkout left unpaid: an invoice of a shop, a till or a pay link that passed
 * its due date with nothing paid is voided, and its order cancelled. Invoices sent for payment by terms
 * (B2B, subscriptions) stay overdue — the Collector and people follow them up.
 */
export function expireInvoices(world: World, at: string): number {
  let voided = 0;
  for (const invoice of world.views.invoices.values()) {
    if (invoice.voided || invoice.paidMinor > 0 || invoice.dueAt > at) continue;
    const order = world.views.orders.get(invoice.orderId);
    if (!order || !checkout.has(order.channel)) continue;
    if (invoice.sessionIds.some((id) => { const s = world.views.sessions.get(id); return s && (s.outcome === 'review' || s.outcome === 'awaiting_capture' || s.outcome === 'awaiting_funds'); })) continue;
    const clock = { via: 'world' as const, controller: 'clock', answering: null };
    appendFacts(world, invoice.invoiceId, [{ type: 'invoice.Voided', payload: { invoiceId: invoice.invoiceId, orderId: invoice.orderId, reason: 'Expired unpaid', by: 'clock' } }], clock, at);
    appendFacts(world, invoice.orderId, [{ type: 'order.Cancelled', payload: { orderId: invoice.orderId, reason: 'Expired unpaid', by: 'clock' } }], clock, at);
    voided += 1;
  }
  return voided;
}
