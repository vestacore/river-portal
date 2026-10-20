/**
 * The four boundaries of the PSP. Each owns one kind of stream and is the only writer of its fact
 * types; each forms its own projection from the facts it hears, whoever wrote them.
 * - `order`: what is bought, from whom, and how the money will be distributed.
 * - `invoice`: the payable claim — how much, by when, and how much is still due.
 * - `session`: one attempt to pay an invoice — the river from unpaid to paid.
 * - `payment`: money secured by an attempt, and its life after the mouth (refunds, disputes, payouts).
 */
export const boundaries = ['order', 'invoice', 'session', 'payment'] as const;
export type Boundary = (typeof boundaries)[number];

/** What a fact can form: the four boundaries' views, and the ledger, which is a projection of them all. */
export const projections = ['order', 'invoice', 'session', 'payment', 'ledger'] as const;
export type Projection = (typeof projections)[number];
