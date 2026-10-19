import { payFacts, type PaymentCaptured, type PaymentFailed, type PaymentPending, type ProviderSessionApproved } from '@river/pay-facts';
import { toMinor } from './toMinor.ts';
import type { ProviderEvent } from './types/ProviderEvent.ts';

/**
 * Reads a verified PayPal webhook as facts for one order: the payer's approval, and what PayPal
 * itself says became of a capture — completed, still pending, or declined. The capture is asked for
 * by the river and usually answered to it directly; these reports matter when that answer was
 * "pending", or never arrived. A capture already known to the river is the same money told twice,
 * and the figure counts it once. Anything else returns null.
 */
export function paypalEventFacts(event: unknown): ProviderEvent | null {
  const e = event as {
    id?: unknown;
    event_type?: unknown;
    resource?: {
      id?: unknown;
      custom_id?: unknown;
      status_details?: { reason?: unknown };
      amount?: { currency_code?: unknown; value?: unknown };
      purchase_units?: Array<{ custom_id?: unknown; reference_id?: unknown }>;
      supplementary_data?: { related_ids?: { order_id?: unknown } };
    };
  };
  const resource = e?.resource;
  if (typeof e?.id !== 'string' || typeof e.event_type !== 'string' || !resource || typeof resource.id !== 'string') return null;

  if (e.event_type === 'CHECKOUT.ORDER.APPROVED') {
    const unit = resource.purchase_units?.[0];
    const orderId = unit?.custom_id ?? unit?.reference_id;
    if (typeof orderId !== 'string') return null;
    const approved: ProviderSessionApproved = { provider: 'paypal', sessionRef: resource.id };
    return { orderId, eventId: e.id, drafts: [{ type: payFacts.providerSessionApproved, payload: approved }] };
  }

  const orderId = resource.custom_id;
  const sessionRef = resource.supplementary_data?.related_ids?.order_id;
  if (typeof orderId !== 'string' || typeof sessionRef !== 'string') return null;
  if (e.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const amountMinor = toMinor(resource.amount?.value);
    if (amountMinor === null) return null;
    const captured: PaymentCaptured = { provider: 'paypal', sessionRef, providerRef: resource.id, amountMinor, currency: String(resource.amount?.currency_code ?? ''), simulated: false };
    return { orderId, eventId: e.id, drafts: [{ type: payFacts.paymentCaptured, payload: captured }] };
  }
  if (e.event_type === 'PAYMENT.CAPTURE.PENDING') {
    const pending: PaymentPending = { provider: 'paypal', sessionRef, providerRef: resource.id, reason: String(resource.status_details?.reason ?? 'pending at PayPal') };
    return { orderId, eventId: e.id, drafts: [{ type: payFacts.paymentPending, payload: pending }] };
  }
  if (e.event_type === 'PAYMENT.CAPTURE.DECLINED' || e.event_type === 'PAYMENT.CAPTURE.DENIED') {
    const failed: PaymentFailed = { provider: 'paypal', sessionRef, reason: 'PayPal declined the capture' };
    return { orderId, eventId: e.id, drafts: [{ type: payFacts.paymentFailed, payload: failed }] };
  }
  return null;
}
