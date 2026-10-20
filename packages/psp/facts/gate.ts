// @river/psp-facts — the shared vocabulary of the PSP (adr/records/ADR-0026): the four boundaries (order,
// invoice, session, payment), the stages of the river, and every fact type with its owner, its speaker
// and the projections it forms. The four boundary packages depend on this gate and on nothing else.
export { currencies } from './types/Currency.ts';
export type { Currency } from './types/Currency.ts';
export { boundaries, projections } from './types/Boundary.ts';
export type { Boundary, Projection } from './types/Boundary.ts';
export { stages } from './types/Stage.ts';
export type { Stage } from './types/Stage.ts';
export { instrumentIds, rails } from './types/InstrumentId.ts';
export type { InstrumentId, Rail } from './types/InstrumentId.ts';
export { channels } from './types/Channel.ts';
export type { Channel } from './types/Channel.ts';
export type { Speaker } from './types/Speaker.ts';
export type { OrderLine } from './types/OrderLine.ts';
export { allocationRoles } from './types/Split.ts';
export type { AllocationRole, SplitRule, SplitPlan, Allocation } from './types/Split.ts';
export type { Posting } from './types/Posting.ts';
export type { InstrumentDetail } from './types/InstrumentDetail.ts';
export type * from './types/OrderFacts.ts';
export type * from './types/InvoiceFacts.ts';
export type * from './types/SessionFacts.ts';
export type * from './types/PaymentFacts.ts';
export type { PayloadMap, FactType } from './types/PayloadMap.ts';
export type { PspFact, PspDraft } from './types/PspFact.ts';
export type { FactDefinition } from './types/FactDefinition.ts';
export type { Projector } from './types/Projector.ts';
export { factCatalogue } from './data/factCatalogue.ts';
export { stageCatalogue } from './data/stageCatalogue.ts';
export { projectionLabels } from './data/projectionLabels.ts';
export { factDefinition } from './factDefinition.ts';
export { isFactType } from './isFactType.ts';
export { factsFormingOf } from './factsFormingOf.ts';
export { currencyOf } from './currencyOf.ts';
