/** Where a batch stands, from the most to the least urgent. */
export const reconciliationStatuses = ['not_reported', 'not_credited', 'short_credit', 'fee_difference', 'gross_difference', 'resolved', 'awaiting_report', 'awaiting_credit', 'matched'] as const;
export type ReconciliationStatus = (typeof reconciliationStatuses)[number];

/** What a batch should hold, from the payments the platform carried, or from the merchant's own records and terms. */
export type ExpectedBatch = { grossMinor: number | null; feeMinor: number | null; netMinor: number | null; source: 'payments' | 'sales' };

/** One difference between what was expected and what was reported or credited. */
export type BatchDifference = { kind: 'report' | 'gross' | 'fee' | 'credit'; expectedMinor: number; actualMinor: number; deltaMinor: number };

/** The reconciliation of one batch. */
export type Reconciliation = { status: ReconciliationStatus; differences: BatchDifference[]; expected: ExpectedBatch | null };
