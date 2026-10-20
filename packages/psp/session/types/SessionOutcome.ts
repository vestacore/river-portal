/**
 * Where an attempt stands. The `awaiting_*` outcomes say whom the river waits for: the payer's word,
 * pushed money, an operator's capture; `review` waits for a person: a compliance officer, or an operator when the money that arrived does not match. The last four are final.
 */
export const sessionOutcomes = ['open', 'review', 'awaiting_consent', 'awaiting_funds', 'awaiting_capture', 'succeeded', 'failed', 'abandoned', 'expired'] as const;
export type SessionOutcome = (typeof sessionOutcomes)[number];
