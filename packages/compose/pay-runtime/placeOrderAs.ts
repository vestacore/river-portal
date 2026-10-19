import { settle } from '@river/figure';
import type { Result } from '@river/kernel';
import { placeOrder, validateOrderInput } from '@river/pay-acts';
import { findMerchant } from './findMerchant.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/**
 * The door, for a merchant: a request for something becomes the first fact of a new stream, and the
 * figure answers at once with the invoice. The pay key is returned here and nowhere else.
 */
export async function placeOrderAs(runtime: PayRuntime, merchantId: string, raw: Record<string, unknown>, at: Date = new Date()): Promise<Result<{ orderId: string; payKey: string }>> {
  const merchant = findMerchant(runtime.config, merchantId);
  if (!merchant) return { ok: false, errors: [{ field: 'merchant', code: 'unknown' }] };
  const input = validateOrderInput(raw);
  if (!input.ok) return input;
  const placed = placeOrder(input.value, { merchantId: merchant.id, providers: merchant.providers }, at);
  await settle(runtime.store, runtime.root, runtime.assembly, {
    stream: placed.orderId,
    at: at.toISOString(),
    actKey: 'place',
    entering: [{ draft: placed.draft, origin: { via: 'door', actor: merchant.id, role: 'merchant' }, causedBy: null }],
  });
  return { ok: true, value: { orderId: placed.orderId, payKey: placed.payKey } };
}
