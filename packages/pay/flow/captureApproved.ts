import { defineJoiner } from '@river/figure';
import { payFacts, type ProviderCaptureRequested } from '@river/pay-facts';
import type { ApprovalState } from './types/ApprovalState.ts';
import type { OrderNeedState } from './types/OrderNeedState.ts';

/** An approval is not yet money: ask the provider to capture, once for each approved session. */
export const captureApproved = defineJoiner<{ order: OrderNeedState; approval: ApprovalState }>({
  id: 'captureApproved',
  demands: { order: 'orderNeed', approval: 'approvalNeed' },
  round: ({ approval }) => approval.approved?.sessionRef ?? 'none',
  emit: ({ order: { order }, approval: { approved } }) => {
    if (!order || !approved) return [];
    const requested: ProviderCaptureRequested = { provider: approved.provider, sessionRef: approved.sessionRef, orderId: order.orderId, amountMinor: order.amountMinor, currency: order.currency };
    return [{ type: payFacts.providerCaptureRequested, payload: requested }];
  },
});
