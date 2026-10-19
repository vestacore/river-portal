import { payFacts, type PaymentCaptured, type PaymentFailed, type ProviderSessionExpired } from '@river/pay-facts';
import type { ProviderEvent } from './types/ProviderEvent.ts';

/**
 * Reads a verified Stripe event as facts for one order. A completed, paid Checkout Session — or a
 * delayed payment that later succeeded — is a capture, reported as Stripe reported it; the mouth
 * compares it with the invoice. A session that expired unpaid, and a delayed payment that failed,
 * end the attempt. Anything else is not this river's business and returns null.
 */
export function stripeEventFacts(event: unknown): ProviderEvent | null {
  const e = event as { id?: unknown; type?: unknown; data?: { object?: Record<string, unknown> } };
  const session = e?.data?.object;
  if (typeof e?.id !== 'string' || typeof e.type !== 'string' || !session) return null;
  const orderId = session.client_reference_id;
  const sessionRef = session.id;
  if (typeof orderId !== 'string' || typeof sessionRef !== 'string') return null;

  if ((e.type === 'checkout.session.completed' && session.payment_status === 'paid') || e.type === 'checkout.session.async_payment_succeeded') {
    const captured: PaymentCaptured = {
      provider: 'stripe',
      sessionRef,
      providerRef: String(session.payment_intent ?? sessionRef),
      amountMinor: Number(session.amount_total),
      currency: String(session.currency ?? '').toUpperCase(),
      simulated: false,
    };
    if (!Number.isInteger(captured.amountMinor)) return null;
    return { orderId, eventId: e.id, drafts: [{ type: payFacts.paymentCaptured, payload: captured }] };
  }
  if (e.type === 'checkout.session.expired') {
    const expired: ProviderSessionExpired = { provider: 'stripe', sessionRef, reason: 'the session expired at Stripe' };
    return { orderId, eventId: e.id, drafts: [{ type: payFacts.providerSessionExpired, payload: expired }] };
  }
  if (e.type === 'checkout.session.async_payment_failed') {
    const failed: PaymentFailed = { provider: 'stripe', sessionRef, reason: 'the payment failed' };
    return { orderId, eventId: e.id, drafts: [{ type: payFacts.paymentFailed, payload: failed }] };
  }
  return null;
}
