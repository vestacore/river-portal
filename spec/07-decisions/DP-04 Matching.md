---
type: decision
status: draft
tags: [decision, flow, matching, vertex, tier/2, tier/3, tier/4]
aliases: [DP-04, Matching, Water Finds Its Level]
related: ["[[Flow]]", "[[Need]]", "[[Gift]]", "[[Vertex AI Integration]]"]
---

# DP-04 Matching

Back to [[Decision Points Overview]]. Roles: [[Responsibility Matrix]].

> [!principle] Water finds its level
> Matching is driven by the **shape of the need** (what, where, when and in what form), not by the giver's convenience or by how photogenic a story is ([[The River Concept]]). AI suggestions are **advisory only**. A named human decides and is accountable.

## Question decided

*Which [[Gift]]s (or parts of gifts) meet which [[Need]]s, grouped in which [[Flow]], and is the Flow ready to commit?*

## Trigger

- A need reaches `open` (after [[DP-01 Need Triage]] and, where required, [[DP-02 Need Verification]]).
- A gift reaches `received` (goods in hand, money received) or `pledged` with a firm date.
- Periodic matching session (e.g. a weekly convoy plan) or a stock-level change at a [[Hub]].

## Roles

| RACI | Role |
|---|---|
| **Decider (R)** | Lead Coordinator of the Flow (a Contributing Coordinator may propose) |
| **Accountable (A)** | Lead Coordinator |
| **Consulted (C)** | Finance Steward (restricted funds); [[Partner Organisation]] co-coordinators; hub lead (stock) |
| **Informed (I)** | [[Recipient]] ("help is being prepared"); [[Giver]]s ("your gift has joined a journey") |

## Inputs

| Input | Source |
|---|---|
| Open needs with form, quantity, location, urgency and age in queue | `views/matchingBoard` |
| Available gifts, stock by hub, restrictions, expiry | `views/giftPool`, `views/hubStock` |
| Restricted-fund rules | Gift restrictions from [[DP-03 Offer Acceptance]] |
| Route feasibility and indicative cost | [[Transport and Logistics Flow]] estimates |
| **AI suggestions**: ranked candidate matches, each with an explanation ("same oblast; generator 3 kW meets stated form; oldest open need in category") | [[Vertex AI Integration]], logged as `flow.MatchSuggested` with `via: vertex` |

## Options and criteria

Criteria, in order:
1. **Fit of form.** The gift meets the need in the form it was asked for (P2).
2. **Urgency and waiting time.** Older and urgent needs come first. Fairness is visible on the board.
3. **Proximity and route efficiency.** This reduces the cost per delivery (P8).
4. **Restrictions honoured.** Sponsor purpose, expiry, cold chain.
5. **Spread.** Avoid repeatedly serving the same easily reached places while remote needs wait.

| Option | Events |
|---|---|
| Form a new Flow | `flow.Formed` { leadCoordinatorId } |
| Add a need or gift to an existing Flow | `flow.NeedLinked`, `gift.Allocated` { flowId, quantity } |
| Partial match | `need.PartiallyMatched` (the remainder stays `open`) |
| Full match | `need.Matched` |
| Commit the Flow | `flow.Committed` hands over to [[DP-05 Routing and Carrier Assignment]] |
| Reject the AI suggestion | `ai.SuggestionRejected` { reason }, used to monitor model quality |

## Guard-rails

1. **AI advisory only.** No `gift.Allocated` or `flow.Committed` event may have `actor.via: vertex`. The command API rejects it ([[Security Rules]]).
2. A giver may not choose a named recipient, and a recipient's identity is never used as a fundraising lever ([[Guiding Principles#P1. A gift is a gift|P1]]).
3. Recipient reputation may not reorder the queue. Only form, urgency, waiting time, route and restrictions may.
4. Restricted funds may not be allocated outside their purpose. A mismatch is blocked, and the Finance Steward is consulted.
5. The matching board shows needs at `team` visibility only: pseudonymised location, no names unless the coordinator is assigned.

## Reversibility and correction

Until [[DP-07 Dispatch]], the decision is fully reversible: `gift.Deallocated` and `flow.NeedUnlinked` with a reason, and the need returns to `open`. After dispatch, changes happen through re-routing at DP-05 or through `consignment.Returned`. Givers see the corrected journey, never a silent edit.

## SLA target

Standard: ≤ 5 working days from `open` to first match. Urgent: ≤ 1 working day. Needs unmatched after 30 days are reviewed with the recipient (keep, adapt the form, or refer).

## Escalation path

Contributing Coordinator → Lead Coordinator → Programme lead → Administrator. Conflicts over scarce stock between flows are decided by the programme lead, and the decision is recorded as `flow.PriorityDecided`.

## Audit record

For each allocation: the suggestion shown, its rank, whether the human followed it, and the stated reason. Fairness dashboard: waiting time by region and category, and the acceptance rate of AI suggestions ([[Accountability and Audit#Audit views]], [[Impact Metrics]]).

## Related notes

[[Flow]] · [[Coordination Model]] · [[Lifecycle of a Need]] · [[Lifecycle of a Gift]] · [[Coordinator Workspace]] · [[Event Catalogue]]
