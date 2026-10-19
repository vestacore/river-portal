import type { JoinerUnit, ListenerUnit } from '@river/figure';
import { approvalNeed } from './approvalNeed.ts';
import { cancelNeed } from './cancelNeed.ts';
import { captureApproved } from './captureApproved.ts';
import { checkoutGate } from './checkoutGate.ts';
import { decideCancellation } from './decideCancellation.ts';
import { extraCapture } from './extraCapture.ts';
import { flagExtraCapture } from './flagExtraCapture.ts';
import { issueInvoice } from './issueInvoice.ts';
import { mouth } from './mouth.ts';
import { openGate } from './openGate.ts';
import { orderNeed } from './orderNeed.ts';
import { settleOrder } from './settleOrder.ts';
import type { PaySettings } from './types/PaySettings.ts';

/**
 * The figure of one payment, from source to mouth: six points of need and six bridges.
 * order → invoice → (the payer's word) → route and session → (approval → capture) → settle;
 * beside the line, a cancellation asked for is decided, and money arriving twice is flagged.
 */
export function payFigure(settings: PaySettings): { listeners: readonly ListenerUnit[]; joiners: readonly JoinerUnit[] } {
  return {
    listeners: [orderNeed, checkoutGate, approvalNeed, mouth, cancelNeed, extraCapture],
    joiners: [issueInvoice(settings), openGate(settings), captureApproved, settleOrder, decideCancellation, flagExtraCapture],
  };
}
