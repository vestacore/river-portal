import type { LocalisedText } from '@river/i18n';

/**
 * What the runtime works out for the swarm about routing and costs — a simulation over history and the
 * costs of the store terminals — so the agents stay pure readers of what they are given.
 */
export type RoutingOutlook = {
  unitId: string;
  strategy: string;
  minApprovalBps: number;
  days: number;
  sessions: number;
  currency: string;
  actualFeeMinor: number;
  actualOnUsShareBps: number;
  simulated: Array<{ strategy: string; feeMinor: number; onUsShareBps: number; approvalDeltaBps: number }>;
  blockedOnUs: Array<{ acquirer: string; acquirerName: LocalisedText; bankName: LocalisedText; approvalBps: number; sessions: number; savingMinor: number }>;
};

/** The card turnover of one region's stores over the last thirty days, what its terminal bank charged, and what the others would. */
export type PosOutlook = {
  regionId: string;
  acquirer: string;
  acquirerName: LocalisedText;
  bankName: LocalisedText;
  days: number;
  volumeMinor: number;
  feeMinor: number;
  ownBankShareBps: number;
  onUsClause: boolean;
  ifOnUsClauseFeeMinor: number | null;
  onUsRateBps: number | null;
  alternatives: Array<{ acquirer: string; acquirerName: LocalisedText; feeMinor: number; onUsShareBps: number }>;
};

/** One settlement batch as reconciliation left it. */
export type ReconciledBatch = {
  batchId: string;
  provider: string;
  providerName: LocalisedText;
  merchantId: string;
  storeId: string | null;
  channel: 'online' | 'in_store' | 'loyalty';
  businessDate: string;
  currency: string;
  status: string;
  grossMinor: number | null;
  netMinor: number | null;
  differences: Array<{ kind: 'report' | 'gross' | 'fee' | 'credit'; expectedMinor: number; actualMinor: number; deltaMinor: number }>;
};
