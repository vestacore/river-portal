---
type: relationship
status: draft
tags: [relationship, flow, sequence, events, tier/1, tier/2, tier/3]
aliases: [Delivery Chain, Source to Mouth, End-to-End Flow]
related: ["[[Flow]]", "[[Event Catalogue]]", "[[Decision Points Overview]]"]
---

# The Delivery Chain

The whole river in one note. It follows a single [[Need]] from the moment it is expressed, through matching, packing, transport and confirmation, to the thanks that travels back upstream. Every step names its actor, the [[Log Event]] it appends, the visibility of that event, and the decision point that governs it. Back to [[Entity Relationship Map]].

Worked example: Olena's request for a generator and winter medicine (see [[Audiences and Personas]]), matched to James's money gift and a donated generator from a [[Partner Organisation]], carried by Mykola, with transport paid by Sarah's company. Demo data: [[Scenario B — Regional Aid Hub]].

## Flow state machine

The [[Flow]] is the unit that the chain moves forward.

```mermaid
stateDiagram-v2
    [*] --> forming: flow.Formed
    forming --> committed: flow.Committed (DP-04 complete, costs estimated)
    committed --> in_motion: flow.MotionStarted (DP-07 first dispatch)
    in_motion --> arrived: flow.Arrived (all consignments delivered)
    arrived --> confirmed: flow.Confirmed (DP-08 accepted)
    confirmed --> reported: flow.Reported (DP-10 report issued)
    reported --> closed: flow.Closed
    forming --> closed: flow.Dissolved (needs withdrawn or referred)
    in_motion --> committed: flow.Replanned (consignment returned or lost)
    closed --> [*]
```

## End-to-end sequence

```mermaid
sequenceDiagram
    autonumber
    actor R as Recipient (Olena)
    participant API as river-api
    actor C as Lead Coordinator (Andriy)
    actor CC as Contributing Coordinator
    actor G as Giver (James)
    actor S as Sponsor (Sarah)
    actor K as Carrier (Mykola)
    actor FS as Finance Steward
    R->>API: submit need (no account, tracking link)
    API-->>R: need.Acknowledged
    C->>API: triage (DP-01), verify (DP-02)
    API-->>C: need.Triaged, verification.Completed, need.Opened
    G->>API: gift via Checkout link
    API-->>API: gift.Received (webhook)
    S->>API: restricted transport pledge
    C->>API: form flow, link need and gifts (DP-04)
    API-->>C: flow.Formed, flow.NeedLinked, gift.Allocated, need.Matched
    CC->>API: plan route and consignment (DP-05)
    API-->>CC: consignment.PackingStarted, leg.Planned, leg.CarrierAssigned
    C->>API: commit flow
    API-->>G: flow.Committed (participants view: "your gift has a journey")
    C->>API: dispatch (DP-07)
    API-->>K: consignment.Dispatched, leg.Departed
    K->>API: fuel receipt photo
    API-->>FS: costRecord.Submitted
    FS->>API: approve (DP-06)
    API-->>S: costRecord.Approved, costRecord.FundingAssigned
    K->>API: handover at hub, then at destination, with proof
    API-->>C: leg.HandedOver, consignment.Delivered, need.Delivered
    R->>API: confirm receipt, optional photo and thanks
    C->>API: review confirmation (DP-08)
    API-->>C: deliveryConfirmation.Accepted, need.Confirmed, flow.Confirmed
    API-->>G: gift.Delivered
    C->>API: moderate thanks with consent (DP-09)
    API-->>G: gratitudeNote.Delivered
    API-->>S: gratitudeNote.Delivered
    API-->>K: gratitudeNote.Delivered
    C->>API: publish report (DP-10)
    API-->>G: flow.Reported, Donor Report
```

## Step → actor → event → visibility → DP

| # | Step | Actor | Event(s) | Visibility | DP |
|---|---|---|---|---|---|
| 1 | Need expressed | [[Recipient]] or proxy | `need.Submitted`, `need.Acknowledged` | `private` | — |
| 2 | Triage | [[Coordinator]] | `need.Triaged` | `team` (safeguarding flag `sealed`) | [[DP-01 Need Triage]] |
| 3 | Proportionate verification | Coordinator / Safeguarding Lead | `verification.Requested`, `verification.Completed` | `sealed` / `private` | [[DP-02 Need Verification]] |
| 4 | Need opened | Coordinator | `need.Opened` | `team` | — |
| 5 | Offers accepted, gifts received | [[Giver]], [[Sponsor]], system | `offer.Accepted`, `gift.Pledged`, `gift.Received` | `private`; ledger aggregate `public` | [[DP-03 Offer Acceptance]] |
| 6 | Flow formed, need and gifts linked | Lead Coordinator | `flow.Formed` (names the Lead Coordinator), `flow.NeedLinked`, `gift.Allocated`, `need.Matched` | `team` | [[DP-04 Matching]] |
| 7 | Consignment packed at a [[Hub]] | [[Volunteer]] | `consignment.PackingStarted`, `consignment.ItemAdded`, `consignment.Ready` | `team` | — |
| 8 | Route planned, carriers assigned | Contributing Coordinator | `leg.Planned`, `leg.CarrierAssigned` | `participants` (pseudonymised) | [[DP-05 Routing and Carrier Assignment]] |
| 9 | Cost estimate and flow commitment | Lead Coordinator | `flow.BudgetEstimated`, `flow.Committed` | `participants` | — |
| 10 | Dispatch | Lead Coordinator | `consignment.Dispatched`, `leg.Departed`, `flow.MotionStarted`, `need.DeliveryStarted` | `participants` | [[DP-07 Dispatch]] |
| 11 | Costs recorded on the road | [[Carrier]] | `costRecord.Submitted` (with receipt [[Media Asset]]) | `team` | — |
| 12 | Costs approved | Finance Steward / Lead | `costRecord.Approved` or `costRecord.Queried` | `public` once approved (aggregated) | [[DP-06 Cost Approval]] |
| 13 | Handover at hub or to the next carrier | Carrier ↔ carrier / hub | `leg.HandedOver`, `hub.ItemsReceived`, `leg.Closed` | `participants` | — |
| 14 | Final handover | Carrier → recipient or proxy | `leg.HandedOver`, `consignment.Delivered`, `need.Delivered` | `participants` | — |
| 15 | Confirmation | Recipient / proxy / carrier with evidence | `deliveryConfirmation.Recorded` | `private` | — |
| 16 | Confirmation review | Coordinator | `deliveryConfirmation.Accepted`, `need.Confirmed`, `flow.Confirmed`, `gift.Delivered` | `participants` | [[DP-08 Delivery Confirmation Review]] |
| 17 | Thanks written, consented, moderated, routed | Recipient, Coordinator | `gratitudeNote.Written`, `gratitudeNote.Approved`, `gratitudeNote.Routed`, `gratitudeNote.Delivered` | as consented | [[DP-09 Publication Consent]] |
| 18 | Reporting | Lead / Editor | `flow.Reported`, `publication.Published` | `participants` / `public` | [[DP-10 Report Publication]] |
| 19 | Closure | System | `flow.Closed`, `need.Closed`, `gift.Acknowledged` | `team` | — |

Reputation signals are recomputed as a side effect of steps 8, 10, 12, 14 and 16 (see [[Reputation Dynamics]]). Visibility of any item can be changed later through [[DP-12 Visibility Change]].

## Decision points in the chain

```mermaid
flowchart TD
    A[need.Submitted] --> D1{DP-01 Triage}
    D1 -- can help --> D2{DP-02 Verification depth}
    D1 -- better elsewhere --> REF[need.Referred]
    D1 -- not now --> HOLD[need.PutOnHold + reviewBy]
    D2 --> OPEN[need.Opened]
    OFFER[offer.Submitted] --> D3{DP-03 Offer acceptance}
    D3 -- accepted --> GIFT[gift.Received]
    D3 -- declined with thanks --> END1((thanks sent))
    OPEN --> D4{DP-04 Matching}
    GIFT --> D4
    D4 --> FLOW[flow.Formed]
    FLOW --> D5{DP-05 Routing and carrier}
    D5 --> D7{DP-07 Dispatch}
    D7 -- go --> MOVE[in_motion]
    D7 -- not safe / not ready --> D5
    MOVE --> D6{DP-06 Cost approval}
    MOVE --> ARR[consignment.Delivered]
    ARR --> D8{DP-08 Confirmation review}
    D8 -- accepted --> CONF[flow.Confirmed]
    D8 -- queried --> ARR
    CONF --> D9{DP-09 Consent}
    D9 --> D10{DP-10 Report publication}
    D10 --> CLOSED[flow.Closed]
```

## Correlation and causation

Every event in one chain shares a `correlationId` equal to the flow id, plus the need id for pre-flow events, which are back-linked by `flow.NeedLinked`. `causationId` points to the event or command that triggered it. This lets the [[Journey Story]] and the [[Flow Map]] rebuild the whole chain from the log, and lets [[Accountability and Audit]] answer "who decided this, and on what basis?" See [[Event Log and Projections]].

## Failure branches (never silent)

| Situation | Events | What participants are told |
|---|---|---|
| Consignment lost | `consignment.Lost`, `flow.Replanned`, `need.PartiallyMatched` | Recipient: "The delivery was lost on the way. We are arranging another." Givers: the same fact, pseudonymised. |
| Consignment returned (border refusal, recipient moved) | `consignment.Returned`, `hub.ItemsReceived` | As above, with the reason category |
| Recipient unreachable at handover | `leg.HandoverFailed`, retry or proxy delivery | Recipient: SMS with new options |
| Confirmation doubtful | `deliveryConfirmation.FollowUpRequested` (DP-08) | Private to coordinator and carrier. Never framed as an accusation. |
| Need withdrawn mid-flow | `need.Withdrawn`, `gift.Reallocated` | Givers: "Your gift is now helping a similar request nearby." |
