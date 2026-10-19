/**
 * `cancellation.Requested` — the door (a merchant or an operator) or the clock: "withdraw this
 * order". It is a request, not a decision: the figure decides inside the wave, where nothing can
 * slip between the looking and the deciding. `unless` says what stands in its way — a merchant's
 * request is refused only while a payment is being collected; the clock's also while any attempt is
 * under way, because an invoice does not expire under a payer who is paying it.
 */
export type CancellationRequested = {
  reason: string;
  unless: 'collecting' | 'underWay';
};
