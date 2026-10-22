/** Where an order stands with its money. Derived from the facts, never set by hand. */
export const orderStatuses = ['awaiting_payment', 'authorised', 'partially_paid', 'paid', 'partially_refunded', 'refunded', 'disputed', 'cancelled'] as const;
export type OrderStatus = (typeof orderStatuses)[number];

/** Where an order stands with its goods. */
export const fulfilmentStates = ['none', 'accepted', 'picked', 'shipped', 'delivered'] as const;
export type FulfilmentState = (typeof fulfilmentStates)[number];
