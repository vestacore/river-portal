import type { ProviderSessionApproved } from '@river/pay-facts';

/**
 * The latest approval a provider reported, while collecting it can still be right: the order
 * stands, and nothing has been settled or flagged for it yet.
 */
export type ApprovalState = {
  approved: ProviderSessionApproved | null;
  closed: boolean;
};
