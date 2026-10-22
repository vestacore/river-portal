import type { Currency } from './Currency.ts';

/** The role a share of the money plays when an order is distributed. */
export const allocationRoles = ['merchant', 'seller', 'platform', 'psp_fee', 'acquirer_fee', 'charity', 'partner', 'reserve'] as const;
export type AllocationRole = (typeof allocationRoles)[number];

/**
 * One rule of a split plan. `basis` says how the share is computed:
 * - `lines`: the seller keeps `bps` of the lines it sold (the rest stays with the remainder);
 * - `percent`: `bps` of the gross amount;
 * - `fixed`: `fixedMinor`;
 * - `fee`: the fee of the payment, computed at capture — the PSP's tariff when the platform holds the money,
 *   the acquirer's price under the merchant's acquiring terms when the acquirer settles to the merchant directly;
 * - `remainder`: what is left — exactly one rule takes it, so the money always sums to the amount.
 * `holdDays` keeps the share in reserve before it may be paid out.
 */
export type SplitRule = {
  recipientUnitId: string;
  role: AllocationRole;
  basis: 'lines' | 'percent' | 'fixed' | 'fee' | 'remainder';
  bps?: number;
  fixedMinor?: number;
  sellerUnitId?: string;
  holdDays?: number;
};

/** How one order's money will be distributed: a template (from the hierarchy) or rules of its own. */
export type SplitPlan = {
  templateId: string | null;
  rules: SplitRule[];
};

/** One stream of the delta: who receives how much of a captured amount, and from when it may be paid out. */
export type Allocation = {
  recipientUnitId: string;
  role: AllocationRole;
  amountMinor: number;
  currency: Currency;
  rule: number;
  holdUntil: string | null;
};
