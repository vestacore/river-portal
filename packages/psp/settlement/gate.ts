// @river/psp-settlement — boundary: settlement (adr/records/ADR-0027). It owns `sales.*` and
// `settlement.*` facts — what the merchant's own systems, the providers and the banks report about a day's
// batch — forms the batch's view, and reconciles a batch three ways. It knows the other boundaries only
// through @river/psp-facts: what the platform's own payments say a batch should hold is given to it.
export { settlementChannels } from './types/SettlementView.ts';
export type { SettlementView, SettlementChannel } from './types/SettlementView.ts';
export { reconciliationStatuses } from './types/Reconciliation.ts';
export type { ReconciliationStatus, ExpectedBatch, BatchDifference, Reconciliation } from './types/Reconciliation.ts';
export { reconciliationStatusLabels, settlementChannelLabels, differenceLabels, resolutionLabels } from './data/settlementLabels.ts';
export { settlementProjector } from './settlementProjector.ts';
export { reconcileBatch } from './reconcileBatch.ts';
