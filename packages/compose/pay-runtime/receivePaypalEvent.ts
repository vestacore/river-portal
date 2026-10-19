import { settle } from '@river/figure';
import { parseJson, paypalEventFacts, verifyPaypalEvent } from '@river/pay-providers';
import { readOrder } from '@river/pay-views';
import { carryPending } from './carryPending.ts';
import { isOrderId } from './isOrderId.ts';
import { safeKey } from './safeKey.ts';
import type { EventOutcome } from './types/EventOutcome.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/**
 * What PayPal reports, at the bank. PayPal is asked whether the webhook is its own before anything
 * is believed; the payer's approval — or what became of a capture — then enters the order's stream
 * once. PayPal's event id is the act key, so a redelivery writes nothing.
 */
export async function receivePaypalEvent(runtime: PayRuntime, input: { headers: Readonly<Record<string, string | undefined>>; body: string }, at: Date = new Date()): Promise<EventOutcome> {
  const { store, root, assembly, config, wire } = runtime;
  const { paypal } = config;
  if (paypal.mode !== 'connected' || paypal.webhookId === '' || paypal.clientId === '' || paypal.secret === '') return 'unavailable';
  const body = parseJson(input.body);
  // Verifying costs two calls to PayPal with this function's credentials, and anyone may post here.
  // So first the cheap questions: is it an event the river reads, about an order the river has?
  const event = paypalEventFacts(body);
  if (!event || !isOrderId(event.orderId) || !(await readOrder(store, root, event.orderId))) return 'ignored';
  const verified = await verifyPaypalEvent({ clientId: paypal.clientId, secret: paypal.secret, apiBase: paypal.apiBase, webhookId: paypal.webhookId, ...(wire ? { fetch: wire } : {}) }, input.headers, body);
  if (!verified) return 'rejected';
  await settle(store, root, assembly, {
    stream: event.orderId,
    at: at.toISOString(),
    actKey: safeKey('event', event.eventId),
    entering: event.drafts.map((draft) => ({ draft, origin: { via: 'world' as const, controller: 'paypal', answering: null }, causedBy: null })),
  });
  if (config.carry === 'inline') await carryPending(runtime, at, event.orderId);
  return 'accepted';
}
