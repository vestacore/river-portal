import type { LocalisedText } from '@river/i18n';
import type { Currency, OrderLine, SplitPlan } from '@river/psp-facts';

/** A named way of distributing an order's money, chosen by a unit's `split.template` policy. */
export type SplitTemplateId = 'direct' | 'marketplace' | 'agency' | 'franchise';

export type SplitTemplate = {
  id: SplitTemplateId;
  label: LocalisedText;
  description: LocalisedText;
};

/** What a template needs to become a plan for one order. */
export type PlanContext = {
  merchantUnitId: string;
  pspUnitId: string;
  /** Whose fee the `fee` rule carries: the PSP's (it holds the money) or the acquirer's (it settles to the merchant directly; `pspUnitId` is then `acq:*`, the acquirer the route will choose). */
  feeRole?: 'psp_fee' | 'acquirer_fee';
  sellerUnitIds: readonly string[];
  commissionBps: number;
  charityBps: number;
  charityUnitId: string | null;
  franchisorUnitId: string | null;
  royaltyBps: number;
  holdDays: number;
};

/** What the allocation of one capture needs. */
export type AllocationInput = {
  amountMinor: number;
  currency: Currency;
  orderTotalMinor: number;
  lines: readonly OrderLine[];
  plan: SplitPlan;
  feeMinor: number;
  at: string;
  reserveBps?: number;
  reserveDays?: number;
};
