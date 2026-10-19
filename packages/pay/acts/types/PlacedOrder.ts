import type { FactDraft } from '@river/stream';

/**
 * What placing an order gives back: the stream to write to, the draft to write, and the pay key —
 * shown to the merchant once, to hand to the payer. Only its hash goes into the river.
 */
export type PlacedOrder = {
  orderId: string;
  payKey: string;
  draft: FactDraft;
};
