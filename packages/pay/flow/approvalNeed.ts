import { defineListener } from '@river/figure';
import { payFacts, type ProviderSessionApproved } from '@river/pay-facts';
import type { ApprovalState } from './types/ApprovalState.ts';

/**
 * Some providers wait to be asked: the payer approved, the capture is still to be requested. An
 * approval is acted on only while the order stands and is not yet paid or flagged — a late approval
 * of an older session must not collect a second payment.
 */
export const approvalNeed = defineListener<ApprovalState>({
  id: 'approvalNeed',
  hears: [payFacts.providerSessionApproved, payFacts.orderCancelled, payFacts.orderPaid, payFacts.paymentMismatched],
  init: { approved: null, closed: false },
  step: (state, fact) => (fact.type === payFacts.providerSessionApproved ? { ...state, approved: fact.payload as ProviderSessionApproved } : { ...state, closed: true }),
  ready: (state) => state.approved !== null && !state.closed,
});
