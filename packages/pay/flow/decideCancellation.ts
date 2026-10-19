import { defineJoiner } from '@river/figure';
import { payFacts, type CancellationRefused, type OrderCancelled } from '@river/pay-facts';
import type { CancelState } from './types/CancelState.ts';

/**
 * A cancellation is decided inside the wave that asks for it — on the stream as it is at that
 * moment, not on what a door or a clock read a moment before. An order is not withdrawn once it is
 * paid, flagged or already withdrawn; nor while a payment is being collected for it; nor, when the
 * clock asks, while any attempt is under way. Otherwise it is withdrawn, and the gate shuts.
 */
export const decideCancellation = defineJoiner<{ cancel: CancelState }>({
  id: 'decideCancellation',
  demands: { cancel: 'cancelNeed' },
  round: ({ cancel }) => `request-${cancel.asked}`,
  emit: ({ cancel }) => {
    const { last, open } = cancel;
    if (!last) return [];
    const reason = cancel.cancelled ? 'the order is already withdrawn'
      : cancel.paid ? 'the order is paid'
      : cancel.flagged ? 'the order is flagged for an operator'
      : open && open.capture !== 'none' ? 'a payment is being collected'
      : open && last.unless === 'underWay' ? 'an attempt is under way'
      : null;
    if (reason) {
      const refused: CancellationRefused = { reason };
      return [{ type: payFacts.cancellationRefused, payload: refused }];
    }
    const cancelled: OrderCancelled = { reason: last.reason, by: last.by };
    return [{ type: payFacts.orderCancelled, payload: cancelled }];
  },
});
