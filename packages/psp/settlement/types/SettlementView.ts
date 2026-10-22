import type { Currency, SettlementLine } from '@river/psp-facts';

export const settlementChannels = ['online', 'in_store', 'loyalty'] as const;
export type SettlementChannel = (typeof settlementChannels)[number];

/**
 * One batch as reconciliation reads it: what the merchant's own systems recorded (`sales`), what the
 * provider reports it settles (`reported`), what the bank credited (`credited`), and what people decided
 * about its differences. Any of the three may be missing — that is what reconciliation is for.
 */
export type SettlementView = {
  batchId: string;
  provider: string;
  merchantId: string;
  storeId: string | null;
  channel: SettlementChannel;
  businessDate: string;
  currency: Currency;
  sales: { source: 'pos' | 'oms' | 'loyalty'; count: number; grossMinor: number; at: string } | null;
  reported: { count: number; grossMinor: number; feeMinor: number; refundsMinor: number; chargebacksMinor: number; netMinor: number; valueDate: string; lines: SettlementLine[]; at: string } | null;
  credited: { account: string; valueDate: string; amountMinor: number; reference: string; at: string } | null;
  resolutions: Array<{ resolution: 'accepted' | 'claim_raised' | 'written_off' | 'corrected'; amountMinor: number; note: string; by: string; at: string }>;
  updatedAt: string;
};
