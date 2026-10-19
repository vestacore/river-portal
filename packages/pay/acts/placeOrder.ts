import { hashToken, newId, newToken } from '@river/kernel';
import { payFacts, type OrderPlaced, type ProviderName } from '@river/pay-facts';
import type { OrderInput } from './types/OrderInput.ts';
import type { PlacedOrder } from './types/PlacedOrder.ts';

/**
 * The source of one payment river: a merchant asks for something. The door is where chance enters —
 * the order's id and the pay key are made here, never inside a figure. The merchant's connected
 * providers are written into the order, so that routing later is a pure function of the stream.
 */
export function placeOrder(input: OrderInput, merchant: { merchantId: string; providers: readonly ProviderName[] }, at: Date = new Date()): PlacedOrder {
  const orderId = newId('order', at);
  const payKey = newToken();
  const placed: OrderPlaced = {
    orderId,
    merchantId: merchant.merchantId,
    payerRef: input.payerRef,
    title: input.title,
    amountMinor: input.amountMinor,
    currency: input.currency,
    payKeyHash: hashToken(payKey),
    providers: [...merchant.providers],
  };
  return { orderId, payKey, draft: { type: payFacts.orderPlaced, payload: placed } };
}
