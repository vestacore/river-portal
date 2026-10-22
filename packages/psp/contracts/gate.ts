// @river/psp-contracts — contracts, tariffs and acquiring terms (adr/records/ADR-0026, ADR-0027): what a
// payment costs is stated before anyone pays — the PSP's tariff when the platform holds the money, the
// acquirer's price under the merchant's own acquiring terms when the acquirer settles to it directly.
export { contractStatuses } from './types/Contract.ts';
export type { Rate, Tariff, Contract, ContractStatus, ContractKind } from './types/Contract.ts';
export { contractStatusLabels, contractKindLabels } from './data/contractLabels.ts';
export { contractSteps } from './data/contractSteps.ts';
export { feeFor } from './feeFor.ts';
export { contractStatusAt } from './contractStatusAt.ts';
export { activeTariffOf } from './activeTariffOf.ts';
export { acquiringModels } from './types/Acquiring.ts';
export type { AcquiringModel, AcquiringTerms, AcquiringCost, PricedCard } from './types/Acquiring.ts';
export { interchangeBps, schemeFeeBps } from './data/interchange.ts';
export { acquiringModelLabels } from './data/acquiringLabels.ts';
export { acquiringCostOf } from './acquiringCostOf.ts';
