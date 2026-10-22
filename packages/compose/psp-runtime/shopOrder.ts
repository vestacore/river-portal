import type { OrderLine } from '@river/psp-facts';
import { placeOrder } from './placeOrder.ts';
import type { World } from './types/World.ts';

/** The units a public visitor can buy from in the demo shops: the retail group's web shop; a marketplace, a charity, a bike shop of the PSP. */
const shops = new Set(['rt-web', 'ou-kvitka-web', 'ou-open-river', 'ou-baltic-bikes-web', 'ou-dnipro-travel-web', 'ou-amber']);

/**
 * An order from the demo shop, placed as the merchant's own server would place it through the API — the
 * visitor is the payer and gets the pay key. Only the demo shops, only lines the shop page offers.
 */
export function shopOrder(world: World, input: { unitId: string; lines: OrderLine[]; payerRef: string }, at: string): { orderId: string; invoiceId: string; payKey: string } | { error: string } {
  if (!shops.has(input.unitId)) return { error: 'not a demo shop' };
  return placeOrder(world, { unitId: input.unitId, channel: input.unitId === 'ou-open-river' ? 'link' : 'web', lines: input.lines, payerRef: input.payerRef }, { via: 'door', actor: `api:${input.unitId}`, role: 'integrator' }, at);
}
