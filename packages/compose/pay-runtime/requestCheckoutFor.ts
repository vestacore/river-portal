import { settle } from '@river/figure';
import type { Result } from '@river/kernel';
import { requestCheckout } from '@river/pay-acts';
import { readOrder, readOrderByPayKey, type OrderStatus, type OrderView } from '@river/pay-views';
import { carryPending } from './carryPending.ts';
import { expireDue } from './expireDue.ts';
import { isOrderId } from './isOrderId.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/**
 * The door, for a payer: "let me pay this". Authority is the pay key — or, for a signed-in payer,
 * being the one the order is addressed to. The word enters the stream only where it can matter:
 * an invoice that waits, or an attempt that failed. Otherwise the order's present state is the answer.
 */
export async function requestCheckoutFor(
  runtime: PayRuntime,
  by: { payKey: string } | { orderId: string; payerRef: string },
  at: Date = new Date(),
): Promise<Result<{ orderId: string; status: OrderStatus; redirectUrl: string | null; standIn: boolean }>> {
  const { store, root, assembly, config } = runtime;
  let view: OrderView | null = null;
  if ('payKey' in by) view = await readOrderByPayKey(store, root, by.payKey);
  else if (isOrderId(by.orderId)) {
    const found = await readOrder(store, root, by.orderId);
    view = found && found.payerRef === by.payerRef ? found : null;
  }
  if (!view) return { ok: false, errors: [{ field: 'order', code: 'notFound' }] };

  if ((view.status === 'invoiced' || view.status === 'retry') && view.invoice) {
    if (view.invoice.expiresAt <= at.toISOString()) {
      await expireDue(runtime, at, view.orderId);
      return { ok: false, errors: [{ field: 'order', code: 'expired' }] };
    }
    await settle(store, root, assembly, {
      stream: view.orderId,
      at: at.toISOString(),
      entering: [{ draft: requestCheckout(view.invoice.invoiceId), origin: { via: 'door', actor: 'payKey' in by ? 'pay-key' : by.payerRef, role: 'payer' }, causedBy: null }],
    });
    if (config.carry === 'inline') await carryPending(runtime, at, view.orderId);
  }
  const after = (await readOrder(store, root, view.orderId)) ?? view;
  return { ok: true, value: { orderId: after.orderId, status: after.status, redirectUrl: after.session?.redirectUrl ?? null, standIn: after.session?.simulated === true } };
}
