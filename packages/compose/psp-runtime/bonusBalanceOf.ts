import type { World } from './types/World.ts';

/**
 * A payer's balance in the merchant's bonus system, as the demo's connector answers it: an opening
 * balance the bonus system holds for the payer, less what the payer has redeemed here and not had back.
 * Points are worth one hryvnia each.
 */
export function bonusBalanceOf(world: World, payerRef: string): number {
  let h = 7;
  for (const c of payerRef) h = (h * 31 + c.charCodeAt(0)) % 9_973;
  const opening = payerRef.startsWith('py_guest') ? 25_000 : h % 9 < 4 ? 0 : 5_000 + (h % 30) * 3_500;
  let used = 0;
  for (const p of world.views.payments.values()) {
    if (p.instrument !== 'bonus_points') continue;
    const order = world.views.orders.get(p.orderId);
    if (order?.payerRef === payerRef) used += p.capturedMinor - p.refundedMinor;
  }
  return Math.max(0, opening - used);
}
