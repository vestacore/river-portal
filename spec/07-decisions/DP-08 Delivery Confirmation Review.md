---
type: decision
status: draft
tags: [decision, delivery, confirmation, gratitude, tier/1, privacy/sensitive]
aliases: [DP-08, Delivery Confirmation Review, The Mouth]
related: ["[[Delivery Confirmation]]", "[[Gratitude Loop]]", "[[Consignment]]"]
---

# DP-08 Delivery Confirmation Review

Back to [[Decision Points Overview]]. Roles: [[Responsibility Matrix]].

> [!principle] The mouth of the river
> Confirmation closes the loop for givers ([[Guiding Principles#P8. Honest numbers, beautifully shown|P8]]) and opens the returning tide ([[Guiding Principles#P9. Thanks travels upstream|P9]]). It must be easy and dignified for the recipient. Thanks is **invited, never required**.

## Question decided

*Did the help arrive with the right person, in the expected form and quantity, and is the evidence sufficient to mark the need `confirmed` and the Flow's delivery `confirmed`?*

## Trigger

- `deliveryConfirmation.Recorded`, by one of:
  - **recipient** (tracking link, SMS reply "ТАК/YES", app);
  - **proxy** (neighbour, institution such as a school or hromada office, or a guardian);
  - **carrier with evidence** when the recipient cannot confirm (handover photo without faces, signature, GPS-free timestamp).
- `leg.HandedOver` on the final leg with no confirmation after 72 hours (the system opens a review).

## Roles

| RACI | Role |
|---|---|
| **Decider (R)** | A [[Coordinator]] who was **not the carrier** on the final leg |
| **Accountable (A)** | Lead Coordinator |
| **Consulted (C)** | Recipient or proxy (a call if details differ); carrier; Safeguarding Lead if the handover raised a concern |
| **Informed (I)** | Givers and sponsors (gift delivered); carriers and volunteers (thanks) |

## Inputs

| Input | Visibility |
|---|---|
| Confirmation: who confirmed, method, items received, condition, optional note, optional photo | `private`; photo has its own [[Consent]] |
| Handover record from the carrier (`leg.HandedOver`) + manifest hash from [[DP-07 Dispatch]] | `team` |
| Discrepancies: missing items, damage | `team` |
| AI evidence completeness check; face detection for blur suggestion | `via: vertex`, advisory |

## Evidence sufficiency ladder

| Level | Evidence | Accepted for |
|---|---|---|
| E1 | Recipient confirmation via their own channel | All deliveries |
| E2 | Proxy confirmation by a known institution or verified neighbour | All deliveries; record the relationship |
| E3 | Carrier evidence (photo of goods at the door or institution, signature) | When the recipient cannot confirm. Contact is attempted afterwards. |
| E4 | Carrier declaration only | Exceptional. Flagged in the ledger as "confirmed by carrier". |

## Options and criteria

| Option | Events |
|---|---|
| Accept | `deliveryConfirmation.Accepted` { level } → `consignment.Delivered`, `need.Delivered`, `need.Confirmed`, `gift.Delivered` |
| Accept with discrepancy | `deliveryConfirmation.Accepted` { discrepancies[] } + remainder back to [[DP-04 Matching]] |
| Request follow-up | `deliveryConfirmation.FollowUpRequested` { channel } |
| Record non-delivery | `consignment.Returned` or `consignment.Lost`; opens [[Escalation and Disputes#Non-delivery]] |

When every need in a Flow is `confirmed`: `flow.Confirmed`. Any `gratitudeNote.Written` is routed upstream ([[Gratitude Note]]).

## Guard-rails

1. Confirmation may never be a condition for future help. A recipient who does not confirm can still ask again at any time.
2. Photos of recipients are never required. A photo of the goods or the doorstep is enough.
3. The reviewer may not be the carrier of the final leg (four-eyes on delivery).
4. Thanks from the recipient is optional, and its absence is invisible in reputation ([[Reputation Dynamics]]).
5. Carrier confirmation may not be used to publish anything about the recipient ([[DP-09 Publication Consent]] still applies).

## Reversibility and correction

`deliveryConfirmation.Reopened` { reason } handles later discovery of a problem, for example when the recipient says "only half arrived". The correction shows in the journey timeline and the ledger. Earlier events remain.

## SLA target

Review ≤ 3 working days after submission. Unconfirmed deliveries prompt follow-up at 72 hours and a coordinator call at 7 days. A need confirmed on carrier evidence alone closes automatically after 30 days (`need.Closed`; [[Canonical Parameters]]).

## Escalation path

Coordinator → Lead Coordinator → Safeguarding Lead (concerns at handover) → Administrator (suspected diversion). Non-delivery: [[Escalation and Disputes]].

## Audit record

Share of deliveries by evidence level, time from dispatch to confirmation, discrepancies, and reviewers versus carriers (to show separation of duties) ([[Accountability and Audit]]).

## Related notes

[[Delivery Confirmation]] · [[Gratitude Loop]] · [[The Delivery Chain]] · [[Journey Story]] · [[Donor Report]]
