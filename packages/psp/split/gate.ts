// @river/psp-split — one payment, many streams (adr/records/ADR-0026): split plans and templates, the
// allocation of a capture into shares that always sum to it, and the reversal of shares when money goes back.
export type { SplitTemplate, SplitTemplateId, PlanContext, AllocationInput } from './types/SplitTemplate.ts';
export { splitTemplates } from './data/splitTemplates.ts';
export { validateSplitPlan } from './validateSplitPlan.ts';
export { allocate } from './allocate.ts';
export { reverseShares } from './reverseShares.ts';
export { planFromTemplate } from './planFromTemplate.ts';
