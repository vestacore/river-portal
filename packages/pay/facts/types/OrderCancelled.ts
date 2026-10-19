/**
 * `order.Cancelled` — a figure: the request is withdrawn and the gate stays shut. The figure writes
 * it when a cancellation was asked for and nothing stood in its way; `by` says who asked — a
 * merchant, an operator, or the clock.
 */
export type OrderCancelled = {
  reason: string;
  by: string;
};
