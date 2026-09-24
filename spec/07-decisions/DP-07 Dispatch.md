---
type: decision
status: draft
tags: [decision, logistics, consignment, tier/1]
aliases: [DP-07, Dispatch, Launching the Boat]
related: ["[[Consignment]]", "[[Leg]]", "[[The Delivery Chain]]"]
---

# DP-07 Dispatch

Back to [[Decision Points Overview]]. Roles: [[Responsibility Matrix]].

## Question decided

*Is this [[Consignment]] complete, correctly packed, documented, funded and safe to leave now on its assigned [[Leg]]?*

## Trigger

- `consignment.Packed` at an origin or [[Hub]], with a leg in state `assigned` and `leg.AssignmentAccepted`.
- A scheduled convoy departure date.

## Roles

| RACI | Role |
|---|---|
| **Decider (R)** | Lead Coordinator, or the hub lead at an intermediate hub (delegated) |
| **Accountable (A)** | Lead Coordinator |
| **Consulted (C)** | [[Carrier]] (final say on their own safety and vehicle); [[Volunteer]]s who packed; Finance Steward if the budget is not yet approved |
| **Informed (I)** | Givers whose gifts are aboard ("your gift is on its way", `participants`); recipient (window of arrival) |

## Inputs: the dispatch checklist

| Check | Source |
|---|---|
| Items packed match allocation (count, condition, expiry) | Packing list vs `gift.Allocated` |
| Documents: customs declaration, CMR, humanitarian cargo letter | Attached [[Media Asset]]s (`team`) |
| Budget pre-approved ([[DP-06 Cost Approval]]) | `costRecord.BudgetApproved` |
| Carrier confirmed and reachable; magic link active | `leg.AssignmentAccepted` |
| Receiving hub or recipient ready (opening hours, contact confirmed) | Handover contact |
| Safety: route not suspended; carrier's own go/no-go | Route status + carrier confirmation |

## Options and criteria

| Option | Event | Criteria |
|---|---|---|
| **Dispatch** | `consignment.Dispatched`, `leg.Departed` | All checks pass or have a logged, justified exception |
| **Dispatch with exception** | `consignment.Dispatched` { exceptions[] } | e.g. budget approval pending but under the Lead Coordinator's threshold |
| **Delay** | `consignment.DispatchDelayed` { reason, newDate } | Any check fails, or weather or safety |
| **Split** | `consignment.Split` | The vehicle cannot take everything. Urgent items go first. |

The carrier's "no-go" on safety grounds is final for their own journey and is never counted against them.

## Outputs and events

`consignment.Ready` · `consignment.Dispatched` { legId, itemsManifestHash } · `leg.Departed` · `flow.MotionStarted` (first departure in a Flow) · `need.DeliveryStarted` for each linked need. Notifications fan out via Pub/Sub ([[Notifications]]).

## Guard-rails

1. No dispatch without an item manifest. The manifest hash is recorded so later "lost" or "delivered" claims can be checked.
2. No live location of carriers is published. [[Flow Map]] shows only region-level progress, delayed and aggregated.
3. A consignment may not be dispatched to a recipient whose need was `withdrawn` after matching. The command API checks this.

## Reversibility and correction

Dispatch cannot be undone. The boat has left. Recall is a new decision: `consignment.Recalled` → `returned`. Loss is recorded as `consignment.Lost` with evidence, and the flow goes back to [[DP-04 Matching]] for replacement.

## SLA target

Dispatch decision on the day the consignment is ready. Delays over 3 days trigger a message to the recipient and the givers.

## Escalation path

Hub lead → Lead Coordinator → Administrator (route suspension, legal or customs problems).

## Audit record

Checklist state at dispatch, exceptions and who accepted them, manifest hash, and time from `flow.Committed` to `leg.Departed` ([[Accountability and Audit]]).

## Related notes

[[Transport and Logistics Flow]] · [[DP-05 Routing and Carrier Assignment]] · [[DP-08 Delivery Confirmation Review]] · [[Item]] · [[Hub]]
