import { settle } from '@river/figure';
import { parseJson, stripeEventFacts, stripeSignatureValid } from '@river/pay-providers';
import { readOrder } from '@river/pay-views';
import { carryPending } from './carryPending.ts';
import { isOrderId } from './isOrderId.ts';
import { safeKey } from './safeKey.ts';
import type { EventOutcome } from './types/EventOutcome.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/**
 * What Stripe reports, at the bank. The signature is checked over the raw body before anything is
 * read; the event is then translated into facts for the order it names — if this river has that
 * order — and enters once: Stripe's event id is the act key, so a redelivery writes nothing.
 */
export async function receiveStripeEvent(runtime: PayRuntime, input: { payload: string; signature: string }, at: Date = new Date()): Promise<EventOutcome> {
  const { store, root, assembly, config } = runtime;
  if (config.stripe.mode !== 'connected' || config.stripe.webhookSecret === '') return 'unavailable';
  if (!stripeSignatureValid({ payload: input.payload, header: input.signature, secret: config.stripe.webhookSecret, nowSeconds: Math.floor(at.getTime() / 1000) })) return 'rejected';
  const event = stripeEventFacts(parseJson(input.payload));
  if (!event || !isOrderId(event.orderId) || !(await readOrder(store, root, event.orderId))) return 'ignored';
  await settle(store, root, assembly, {
    stream: event.orderId,
    at: at.toISOString(),
    actKey: safeKey('event', event.eventId),
    entering: event.drafts.map((draft) => ({ draft, origin: { via: 'world' as const, controller: 'stripe', answering: null }, causedBy: null })),
  });
  if (config.carry === 'inline') await carryPending(runtime, at, event.orderId);
  return 'accepted';
}
