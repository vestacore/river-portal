/** Self-assessed urgency band. Used for ordering together with waiting time; never for worthiness. */
export const urgencies = ['today', 'this_week', 'this_month', 'when_possible'] as const;
export type Urgency = (typeof urgencies)[number];
