import type { Channel } from './Channel.ts';
import type { Currency } from './Currency.ts';
import type { OrderLine } from './OrderLine.ts';
import type { SplitPlan } from './Split.ts';

// Facts of the `order` boundary. Only the order's own stream holds them (key: orderId).

/** `order.Created` — the door, by a merchant (cabinet, shop or API): what is bought and how it will be distributed. */
export type OrderCreated = {
  orderId: string;
  unitId: string;
  merchantId: string;
  reference: string;
  channel: Channel;
  currency: Currency;
  lines: OrderLine[];
  totalMinor: number;
  payerRef: string;
  split: SplitPlan;
  captureMode: 'auto' | 'manual';
};

/** `order.Cancelled` — the door: the merchant withdraws an order nobody has paid. */
export type OrderCancelled = {
  orderId: string;
  reason: string;
  by: string;
};

/** `fulfilment.Accepted` — the door: the merchant takes the order into work. */
export type FulfilmentAccepted = {
  orderId: string;
  by: string;
};

/** `fulfilment.Shipped` — the door: the goods left; a carrier and its tracking reference. */
export type FulfilmentShipped = {
  orderId: string;
  carrier: string;
  trackingRef: string;
};

/** `fulfilment.Delivered` — the world (the carrier): the goods arrived. */
export type FulfilmentDelivered = {
  orderId: string;
};
