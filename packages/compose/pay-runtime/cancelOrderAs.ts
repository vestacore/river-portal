import { settle } from '@river/figure';
import type { Result } from '@river/kernel';
import { requestCancellation } from '@river/pay-acts';
import { payFacts } from '@river/pay-facts';
import { readOrder, type OrderStatus } from '@river/pay-views';
import { isOrderId } from './isOrderId.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/**
 * The door, for withdrawing a request: the merchant for its own order, an operator for any. The
 * door only asks; the figure decides inside the wave, on the stream as it is at that moment. It
 * refuses an order that is paid, flagged or already withdrawn — undoing money is a different river —
 * and one whose payment is being collected: the capture is on its way and must not land on a
 * withdrawn order. What already happened stays in the stream either way.
 */
export async function cancelOrderAs(
  runtime: PayRuntime,
  by: { role: 'merchant' | 'operator'; id: string },
  orderId: string,
  reason: string,
  at: Date = new Date(),
): Promise<Result<{ orderId: string; status: OrderStatus }>> {
  const { store, root, assembly } = runtime;
  const view = isOrderId(orderId) ? await readOrder(store, root, orderId) : null;
  if (!view || (by.role === 'merchant' && view.merchantId !== by.id)) return { ok: false, errors: [{ field: 'order', code: 'notFound' }] };
  // A courtesy, to keep requests that cannot succeed out of the stream; the decision itself is the figure's.
  if (view.status === 'paid' || view.status === 'flagged' || view.status === 'cancelled') return { ok: false, errors: [{ field: 'order', code: 'settled' }] };
  const receipt = await settle(store, root, assembly, {
    stream: view.orderId,
    at: at.toISOString(),
    entering: [{ draft: requestCancellation(reason || (by.role === 'operator' ? 'withdrawn by an operator' : 'withdrawn by the merchant')), origin: { via: 'door', actor: by.id, role: by.role }, causedBy: null }],
  });
  if (!receipt.facts.some((fact) => fact.type === payFacts.orderCancelled)) {
    const refusal = receipt.facts.find((fact) => fact.type === payFacts.cancellationRefused)?.payload.reason;
    return { ok: false, errors: [{ field: 'order', code: refusal === 'a payment is being collected' ? 'collecting' : 'settled' }] };
  }
  return { ok: true, value: { orderId: view.orderId, status: (await readOrder(store, root, view.orderId))?.status ?? 'cancelled' } };
}
