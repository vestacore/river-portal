import { appendFacts } from './appendFacts.ts';
import { guard } from './guard.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/** The merchant moves an order's goods along: taken into work, shipped with a tracking reference, delivered. */
export function markFulfilment(world: World, actor: Actor | null, orderId: string, step: 'accepted' | 'shipped' | 'delivered', at: string, tracking?: { carrier: string; ref: string }): CommandResult {
  const order = world.views.orders.get(orderId);
  if (!order) return { ok: false, error: 'not_found' };
  if (actor) { const denied = guard(world, actor, 'orders.write', order.unitId, at); if (denied) return { ok: false, error: denied }; }
  const by = actor?.kind === 'person' ? actor.personId : 'merchant';
  const door = { via: 'door' as const, actor: by, role: 'merchant' };
  if (step === 'accepted') appendFacts(world, orderId, [{ type: 'fulfilment.Accepted', payload: { orderId, by } }], door, at);
  if (step === 'shipped') appendFacts(world, orderId, [{ type: 'fulfilment.Shipped', payload: { orderId, carrier: tracking?.carrier ?? 'Lastivka Logistics', trackingRef: tracking?.ref ?? `LL${orderId.slice(-8)}` } }], door, at);
  if (step === 'delivered') appendFacts(world, orderId, [{ type: 'fulfilment.Delivered', payload: { orderId } }], { via: 'world', controller: 'carrier', answering: null }, at);
  return { ok: true, value: { orderId } };
}
