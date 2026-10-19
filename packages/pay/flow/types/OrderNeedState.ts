import type { OrderPlaced } from '@river/pay-facts';

/** What the order's point of need holds: the order as it was placed, and when. */
export type OrderNeedState = {
  order: OrderPlaced | null;
  placedAt: string | null;
};
