import type { WebhookDelivery, WebhookEndpoint } from '@river/psp-integration';
import type { InvoiceView } from '@river/psp-invoice';
import type { OrderView } from '@river/psp-order';
import type { PaymentView } from '@river/psp-payment';
import type { AmlAlert, KybCase } from '@river/psp-risk';
import type { SessionView } from '@river/psp-session';
import type { Unit } from '@river/psp-units';

/** What the swarm reads: the four boundaries' views and the cabinets' records, at one moment. */
export type SwarmInput = {
  now: string;
  units: readonly Unit[];
  orders: readonly OrderView[];
  invoices: readonly InvoiceView[];
  sessions: readonly SessionView[];
  payments: readonly PaymentView[];
  alerts: readonly AmlAlert[];
  onboarding: readonly KybCase[];
  endpoints: readonly WebhookEndpoint[];
  deliveries: readonly WebhookDelivery[];
};
