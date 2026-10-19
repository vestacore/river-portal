/** `checkout.Refused` — a figure: the gate could not be opened (no connected provider carries this order). */
export type CheckoutRefused = {
  attempt: number;
  reason: string;
};
