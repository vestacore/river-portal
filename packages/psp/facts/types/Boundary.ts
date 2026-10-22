/**
 * The boundaries. Each owns one kind of stream and is the only writer of its fact types; each forms its
 * own projection from the facts it hears, whoever wrote them.
 * - `order`: what is bought, from whom, and how the money will be distributed.
 * - `invoice`: the payable claim — how much, by when, and how much is still due.
 * - `session`: one attempt to pay an invoice, from unpaid to paid.
 * - `payment`: money secured by an attempt, and its life after it (refunds, disputes, settlement).
 * - `settlement`: what the providers, the merchant's own systems and the banks report about a day's
 *   batch — the material of reconciliation.
 */
export const boundaries = ['order', 'invoice', 'session', 'payment', 'settlement'] as const;
export type Boundary = (typeof boundaries)[number];

/** What a fact can form: the boundaries' views, and the ledger, which is a projection of the money's facts. */
export const projections = ['order', 'invoice', 'session', 'payment', 'settlement', 'ledger'] as const;
export type Projection = (typeof projections)[number];
