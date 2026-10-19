import { defineListener } from '@river/figure';
import { payFacts, type OrderPlaced } from '@river/pay-facts';
import type { OrderNeedState } from './types/OrderNeedState.ts';

/** The source: a request for something. It needs one thing — the order itself. */
export const orderNeed = defineListener<OrderNeedState>({
  id: 'orderNeed',
  hears: [payFacts.orderPlaced],
  init: { order: null, placedAt: null },
  step: (_state, fact) => ({ order: fact.payload as OrderPlaced, placedAt: fact.at }),
  ready: (state) => state.order !== null,
});
