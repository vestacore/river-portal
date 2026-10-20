import type { Allocation, Channel, Currency, FactType, OrderLine, SplitPlan } from '@river/psp-facts';
import type { FulfilmentState, OrderStatus } from './OrderStatus.ts';

/**
 * The order as the cabinets read it — a fold of its own stream and of every bridge, invoice and
 * payment fact that names it. `held` are funds authorised but not yet captured, per payment;
 * `allocations` is the net delta: what each recipient keeps after refunds and lost disputes.
 */
export type OrderView = {
  orderId: string;
  unitId: string;
  merchantId: string;
  reference: string;
  channel: Channel;
  createdAt: string;
  updatedAt: string;
  currency: Currency;
  lines: OrderLine[];
  totalMinor: number;
  payerRef: string;
  split: SplitPlan;
  captureMode: 'auto' | 'manual';
  invoiceIds: string[];
  paymentIds: string[];
  held: Record<string, number>;
  paidMinor: number;
  refundedMinor: number;
  chargebackMinor: number;
  disputes: Record<string, number>;
  status: OrderStatus;
  fulfilment: FulfilmentState;
  tracking: { carrier: string; ref: string } | null;
  allocations: Allocation[];
  cancelled: { reason: string; by: string } | null;
  timeline: Array<{ at: string; type: FactType; stream: string; seq: number }>;
};
