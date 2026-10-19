import type { OrderStatus } from './types/OrderStatus.ts';
import type { OrderView } from './types/OrderView.ts';

/**
 * Where an order stands, read off its parts. A flag outranks everything — also payment, when money
 * arrived twice; then paid; then withdrawn. Otherwise the attempt under way says it: a provider is
 * being asked for its page, the page waits for the payer, or the money is being collected. With no
 * attempt under way the order waits for the payer — for the first time, or again after a failure —
 * unless the gate refused it.
 */
export function statusOf(view: Pick<OrderView, 'flag' | 'paid' | 'cancelled' | 'invoice' | 'attempts' | 'refused'>): OrderStatus {
  if (view.flag) return 'flagged';
  if (view.paid) return 'paid';
  if (view.cancelled) return 'cancelled';
  if (!view.invoice) return 'placed';
  const { open, attempt } = view.attempts;
  if (open) return open.sessionRef === null ? 'routing' : open.capture === 'none' ? 'open' : 'approved';
  if (view.refused) return 'refused';
  return attempt === 0 ? 'invoiced' : 'retry';
}
