import type { WebhookDelivery, WebhookEndpoint } from '@river/psp-integration';
import type { InvoiceView } from '@river/psp-invoice';
import type { OrderView } from '@river/psp-order';
import type { PaymentView } from '@river/psp-payment';
import type { AmlAlert, KybCase } from '@river/psp-risk';
import type { SessionView } from '@river/psp-session';
import type { Unit } from '@river/psp-units';
import type { PosOutlook, ReconciledBatch, RoutingOutlook } from './Outlook.ts';

/**
 * What the swarm reads: the boundaries' views and the cabinets' records, at one moment — and, where the
 * stand routes by cost and reconciles its banks, the routing outlook, the stores' terminal costs and the
 * reconciled batches.
 */
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
  /** Who holds the money: the platform (custodial, a PSP) or the merchant's own acquirers (direct). */
  settlement?: 'custodial' | 'direct';
  routing?: RoutingOutlook | null;
  pos?: readonly PosOutlook[];
  reconciled?: readonly ReconciledBatch[];
};
