---
type: decision
status: draft
tags: [decision, offer, gift, right-bank, tier/1, vertex]
aliases: [DP-03, Offer Acceptance]
related: ["[[Offer]]", "[[Gift]]", "[[Intent Statement]]"]
---

# DP-03 Offer Acceptance

Back to [[Decision Points Overview]]. Roles: [[Responsibility Matrix]].

> [!principle] Clear water
> [[Guiding Principles#P6. Clear water — clarity and purity of intent|P6]]: offers with hidden agendas are declined kindly. These include proselytising, political capture, data harvesting, publicity-for-sale, and goods "donated" to dispose of waste. [[Guiding Principles#P1. A gift is a gift|P1]]: acceptance never buys visibility or influence.

## Question decided

*Is this [[Offer]] useful for current or foreseeable needs, clear enough to act on, and clean in intent, so that we should accept it and turn it into one or more [[Gift]]s?*

## Trigger

`offer.Submitted` (through [[Giver Section]], a [[Campaign Page]], a partner feed, or studio entry on behalf of a giver). Money offers made through an external payment link skip this DP when the campaign accepts any amount. They go straight to `gift.Pledged`, and later `gift.Received` from the provider webhook.

## Roles

| RACI | Role |
|---|---|
| **Decider (R)** | [[Coordinator]] (intake or campaign owner) |
| **Accountable (A)** | Lead Coordinator; **Finance Steward** for money offers with conditions (restricted funds) or above the org's due-diligence threshold |
| **Consulted (C)** | Hub lead (storage capacity); Safeguarding Lead for offers of *time with people* such as volunteering with children |
| **Informed (I)** | [[Giver]] / [[Sponsor]] / [[Partner Organisation]] |

## Inputs

- The offer: type (money, goods, service, time, transport), quantity, condition, location, restrictions, [[Intent Statement]].
- Open and forecast needs by [[Category]] and region (`views/needDemand`).
- [[Hub]] capacity and expiry constraints (food, medicine).
- Giver [[Reputation Signals]] (reliability of past pledges). These can shape **clarification**, never gratitude.
- AI assistance: a clarity rewrite and a "likely matches" hint (`via: vertex`, advisory).

## Options and criteria

| Option | Status | Criteria |
|---|---|---|
| **Accept** | `accepted` → `gift.Pledged` | Useful now or in the forecast, transportable, safe, legal, and no conditions that conflict with principles |
| **Clarify** | `clarifying` | Missing quantity, condition, pick-up location or restriction details |
| **Accept partly** | `accepted` (partial) | E.g. accept the winter coats, gently decline the summer clothes |
| **Decline with thanks** | `declined_with_thanks` | Not needed, cannot be stored or moved, or unsafe (expired medicine, used child car seats) |
| **Decline: intent** | `declined_with_thanks` { reason: `intent` } | The condition requires publicity, naming of recipients, religious or political messaging, data access, or exclusivity |
| **Redirect** | `declined_with_thanks` + suggestion | A partner can use it better |

Restricted money (e.g. "transport only") is accepted only if the purpose exists in an active [[Campaign]] or [[Programme]]. The restriction is recorded on the gift and enforced at [[DP-06 Cost Approval]].

## Outputs and events

`offer.ClarificationRequested` · `offer.Accepted` { partial, restrictions } · `offer.DeclinedWithThanks` { reasonCode, message } · `gift.Pledged` { giftId, offerId, form, amount?, currency? } · `offer.Expired` (system, after a period with no response).

## Guard-rails

1. Amount never changes courtesy. Every giver gets the same warmth and the same reporting, whatever the size of the gift ([[Recognition Anti-Patterns]]).
2. No acceptance may promise publicity, naming or the choice of a specific recipient to the giver.
3. AI may draft a clarification message but may not send it or decline an offer.
4. A decline must always thank the giver and, where possible, suggest a useful alternative.

## Reversibility and correction

Before conversion, `offer.AcceptanceWithdrawn` can be recorded with an apology and a reason. After conversion, gifts are corrected at the Gift level (`gift.ReturnedToGiver`, `gift.Reallocated`). A giver may withdraw their offer at any time before `gift.Received` (`offer.Withdrawn`).

## SLA target

First response ≤ 3 working days (≤ 1 day for time-limited goods such as food). Clarification loops have a 14-day expiry.

## Escalation path

Coordinator → Lead Coordinator → Finance Steward (money or restrictions) → Administrator (reputational or legal risk, e.g. sanctioned entities). Giver disputes: [[Escalation and Disputes]].

## Audit record

Acceptance ratio by reason code. Restricted gifts register. Due-diligence checks for large money offers are recorded as `verification.Completed` on the giver organisation ([[Accountability and Audit]]).

## Related notes

[[Lifecycle of a Gift]] · [[Money Flow and Cost Transparency]] · [[Giver]] · [[Sponsor]] · [[Gratitude Loop]]
