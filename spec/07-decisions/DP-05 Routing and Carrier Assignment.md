---
type: decision
status: draft
tags: [decision, logistics, leg, carrier, tier/1, tier/3]
aliases: [DP-05, Routing, Carrier Assignment]
related: ["[[Leg]]", "[[Carrier]]", "[[Transport and Logistics Flow]]"]
---

# DP-05 Routing and Carrier Assignment

Back to [[Decision Points Overview]]. Roles: [[Responsibility Matrix]].

## Question decided

*By which route, through which [[Hub]]s and in which [[Leg]]s should this [[Consignment]] travel, and which [[Carrier]] takes each leg?*

## Trigger

- `flow.Committed` from [[DP-04 Matching]].
- Disruption: `leg.AssignmentDeclined`, a border or road closure, a carrier falling ill, or a hub at capacity.
- Consolidation opportunity: another committed Flow going the same way (for example UK → Poland → Lviv).

## Roles

| RACI | Role |
|---|---|
| **Decider (R)** | Lead Coordinator, or a Contributing Coordinator with logged delegation (`flow.ResponsibilityDelegated`) |
| **Accountable (A)** | Lead Coordinator |
| **Consulted (C)** | Carrier (availability, vehicle, capacity); hub lead; Finance Steward for the budgeted cost ([[DP-06 Cost Approval]]); [[Partner Organisation]] operating a hub or leg |
| **Informed (I)** | Recipient (expected window only); givers (journey started, at `participants` level) |

## Inputs

| Input | Notes |
|---|---|
| Consignment size, weight, special handling (medicine, cold chain, fragile) | From packing plan |
| Carriers available, with vehicle type, region and documents (customs, insurance) | `views/carrierRoster` |
| Carrier [[Reputation Signals]]: reliability, timeliness, evidence completeness | Advisory. Explained, never a single score. |
| Hub capacity and opening hours | `views/hubStock` |
| Indicative costs: fuel, ferry, tolls, postage, customs | Rate card + AI estimate (`via: vertex`, advisory) |
| Safety advisories for the destination oblast | Manually curated by the Lead Coordinator. No automated risk scoring of places. |

## Options and criteria

| Option | When |
|---|---|
| **Direct leg** (single carrier, origin → recipient) | Tier 1 van runs; short distances |
| **Multi-leg via hubs** | Cross-border or consolidated loads (UK → PL → Lviv hub → Kharkiv oblast) |
| **Postal or courier** | Small parcels. The courier is the carrier and tracking is imported. |
| **Partner leg** | A partner organisation carries it under its own procedures. The handover is logged. |
| **Hold at hub** | Road not safe, or recipient unavailable. Consignment stays `ready`. |

Criteria: safety of people first, then reliability, then cost per delivery, then speed. A carrier may always decline a leg without penalty to their signals. Declining is not unreliability.

## Outputs and events

`leg.Planned` { from, to, hubId?, plannedDate, budgetedCost } · `leg.CarrierAssigned` { carrierId, magicLinkIssued } · `leg.AssignmentAccepted` · `leg.AssignmentDeclined` { reason } · `consignment.Rerouted` { fromPlan, toPlan, reason }. A leg-scoped magic link lets the carrier see only what they need: pick-up and drop-off points, contact for the handover, and item list ([[Identity and Access]]).

## Guard-rails

1. Carriers never see recipient details beyond the drop-off point and the handover contact, and only for their own leg ([[Visibility Levels]]).
2. No carrier may be pressured into an unsafe leg. Safety declines are logged as `reason: safety` and excluded from reliability signals.
3. The recipient's exact address is released to the final-leg carrier only at `leg.CarrierAssigned`, and it expires at `leg.Closed`.
4. AI route and cost estimates are shown as estimates. Budgeted costs still need DP-06.

## Reversibility and correction

Reversible until `leg.Departed`: `leg.CarrierUnassigned`, `leg.Cancelled`, `consignment.Rerouted`. After departure, re-routing is a new plan for the remaining legs. The departed leg remains in the log as it happened.

## SLA target

Plan legs ≤ 2 working days after `flow.Committed` (urgent: same day). The carrier responds to an assignment within 24 hours, otherwise the leg is re-offered.

## Escalation path

Coordinator → Lead Coordinator → Programme lead. Safety concerns about a route go straight to the Administrator, who can suspend a route for everyone (`organisation.RouteSuspended`).

## Audit record

Planned versus actual route, time per leg, and budgeted versus actual cost per leg (linked to [[Cost Record]]s). All carrier declines are listed with reasons ([[Accountability and Audit]]).

## Related notes

[[Transport and Logistics Flow]] · [[The Delivery Chain]] · [[Consignment]] · [[Carrier]] · [[Hub]] · [[DP-07 Dispatch]] · [[Flow Map]]
