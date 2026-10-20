// @river/psp-session — boundary: the payment session (adr/records/ADR-0026), one attempt to pay an
// invoice: the river from unpaid to paid. It owns the bridges — every fact that stands on a stage of the
// river — and forms the attempt's view from its own stream alone. Through @river/psp-facts only.
export { sessionOutcomes } from './types/SessionOutcome.ts';
export type { SessionOutcome } from './types/SessionOutcome.ts';
export type { SessionView } from './types/SessionView.ts';
export { sessionOutcomeLabels } from './data/sessionOutcomeLabels.ts';
export { sessionProjector } from './sessionProjector.ts';
export { isSessionClosed } from './isSessionClosed.ts';
