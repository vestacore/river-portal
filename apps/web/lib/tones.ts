import type { InvoiceStatus } from '@river/psp-invoice';
import type { OrderStatus } from '@river/psp-order';
import type { PaymentStatus } from '@river/psp-payment';
import type { SessionOutcome } from '@river/psp-session';
import type { Tone } from '@/components/panels/Value';

/** The tone each status is drawn in, the same in every panel. */
export const orderTone: Record<OrderStatus, Tone> = { awaiting_payment: 'neutral', authorised: 'info', partially_paid: 'warning', paid: 'success', partially_refunded: 'warning', refunded: 'neutral', disputed: 'danger', cancelled: 'neutral' };
export const invoiceTone: Record<InvoiceStatus, Tone> = { issued: 'neutral', viewed: 'info', partially_paid: 'warning', paid: 'success', partially_refunded: 'warning', refunded: 'neutral', overdue: 'danger', void: 'neutral' };
export const paymentTone: Record<PaymentStatus, Tone> = { authorised: 'info', received: 'info', captured: 'success', partially_refunded: 'warning', refunded: 'neutral', disputed: 'danger', chargeback: 'danger', voided: 'neutral', expired: 'neutral' };
export const sessionTone: Record<SessionOutcome, Tone> = { open: 'info', review: 'warning', awaiting_consent: 'info', awaiting_funds: 'info', awaiting_capture: 'warning', succeeded: 'success', failed: 'danger', abandoned: 'neutral', expired: 'neutral' };
