import type { OrderLine } from '@river/psp-facts';
import { appendFacts } from './appendFacts.ts';
import { groceryProducts } from './data/retailCatalogue.ts';
import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import { recordPicking } from './recordPicking.ts';
import { refundPayment } from './refundPayment.ts';
import { requestCapture } from './requestCapture.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

const oms = { via: 'door' as const, actor: 'api:oms', role: 'integrator' };
const omsWorld = { via: 'world' as const, controller: 'oms', answering: null };

/** A weight between 93 and 100 % of the estimate, the same for the same order and line. */
function scale(orderId: string, sku: string): number {
  let h = 2_166_136_261;
  for (const ch of `${orderId}:${sku}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16_777_619); }
  return 930 + ((h >>> 0) % 71);
}

/**
 * The demo's stand-in for the merchant's order system reporting an order picked, started by a person from
 * the order's page: weighed goods at what the scales showed — at most the estimate — and the rest as
 * ordered. The invoice follows the picked total; a hold is captured for it, less the bonus points already
 * taken, and the rest released — or released whole when the points paid for everything. An order paid in
 * full before picking is refunded the difference, when the person may refund. In a deployment the order
 * system sends the same through the API.
 */
export function reportPicking(world: World, actor: Actor, orderId: string, at: string): CommandResult<{ orderId: string; totalMinor: number }> {
  const order = world.views.orders.get(orderId);
  if (!order) return { ok: false, error: 'not_found' };
  const denied = guard(world, actor, 'orders.write', order.unitId, at);
  if (denied) return { ok: false, error: denied };
  if (order.picked) return { ok: false, error: 'already picked' };
  if (order.status === 'cancelled') return { ok: false, error: 'nothing_to_decide' };
  const changes: Array<{ sku: string; kind: 'weight' | 'missing' | 'substitute'; deltaMinor: number }> = [];
  const lines: OrderLine[] = order.lines.map((line) => {
    if (!groceryProducts.find((p) => p.sku === line.sku)?.weighed) return line;
    const total = Math.round((line.totalMinor * scale(orderId, line.sku)) / 1_000);
    if (total !== line.totalMinor) changes.push({ sku: line.sku, kind: 'weight', deltaMinor: total - line.totalMinor });
    return { ...line, unitMinor: total, totalMinor: total };
  });
  const picked = recordPicking(world, orderId, { lines, changes }, omsWorld, at);
  if ('error' in picked) return { ok: false, error: picked.error };
  const payments = order.paymentIds.map((id) => world.views.payments.get(id)).filter((p) => p !== undefined);
  const held = payments.find((p) => p.status === 'authorised');
  const invoice = world.views.invoices.get(order.invoiceIds[0] ?? '');
  const rest = picked.totalMinor - (invoice?.paidMinor ?? 0);
  if (held && rest <= 0) {
    appendFacts(world, held.sessionId, [
      { type: 'capture.Voided', payload: { sessionId: held.sessionId, paymentId: held.paymentId, orderId, by: 'api:oms', reason: 'Paid in full with bonus points' } },
      { type: 'session.Failed', payload: { sessionId: held.sessionId, invoiceId: held.invoiceId, code: 'voided', reason: 'Paid in full with bonus points' } },
    ], oms, at);
  } else if (held) requestCapture(world, held.paymentId, Math.min(rest, held.amountMinor), 'api:oms', oms, at);
  else if (rest < 0) {
    const paid = payments.find((p) => p.capturedMinor - p.refundedMinor >= -rest && p.instrument !== 'bonus_points');
    if (paid) refundPayment(world, actor, paid.paymentId, -rest, 'picked_less', at);
  }
  if (actor.kind === 'person') recordAudit(world, { personId: actor.personId, role: actor.role, unitId: order.unitId, action: 'order.picking_reported', target: orderId, detail: { 'en-GB': 'Reported picking on behalf of the order system (demo)', uk: 'Повідомив про комплектацію замість системи замовлень (демо)' }, at });
  return { ok: true, value: { orderId, totalMinor: picked.totalMinor } };
}
