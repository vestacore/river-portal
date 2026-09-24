---
type: decision
status: draft
tags: [decision, reputation, trust, fairness]
aliases: [DP-11, Reputation Review, Contesting the Current]
related: ["[[Reputation]]", "[[Reputation Signals]]", "[[Reputation Dynamics]]"]
---

# DP-11 Reputation Review

Back to [[Decision Points Overview]]. Roles: [[Responsibility Matrix]].

> [!principle] The current carries trust, and it must be explainable
> [[Reputation]] is a set of explainable signals derived from the log, not a single score. Every subject can see their own signals and the events behind them, and can contest them. For recipients, signals are internal only and **never** gate access ([[Guiding Principles#P3. The left bank is always open|P3]]).

## Question decided

*Is a [[Reputation Signals|reputation signal]] (or the event behind it) correct, fairly attributed and fairly explained, and if not, how is it corrected?*

## Trigger

- `reputation.ContestRaised` by the subject (from their profile: "This doesn't look right").
- A coordinator notices a mis-attribution (e.g. a late delivery caused by a border closure counted against a carrier).
- Periodic fairness audit showing a skew across groups or regions.
- Upstream correction: an underlying event was reversed (e.g. `deliveryConfirmation.Reopened`).

## Roles

| RACI | Role |
|---|---|
| **Decider (R)** | A reviewer **not involved** in the flows concerned: another Lead Coordinator or an Administrator-appointed reviewer |
| **Accountable (A)** | Administrator |
| **Consulted (C)** | The subject (always heard); coordinators of the flows concerned; Safeguarding Lead if the contest reveals a concern |
| **Informed (I)** | The subject, with the outcome and its explanation |

## Inputs

- The contested signal(s): reliability, timeliness, clarity, evidence completeness, gratitude received, confirmed deliveries.
- The **events behind each signal**, as shown to the subject, plus `team`-visible context where the subject is allowed to see it.
- The subject's statement and any evidence (e.g. a photo of a closed road).
- Signal definitions and projection version ([[Reputation Signals]]).

## Options and criteria

| Option | Event | Criteria |
|---|---|---|
| Uphold | `reputation.ContestRejected` { outcome: upheld, explanation } | Event correct and fairly attributed |
| Annotate | `reputation.SignalAnnotated` { note } | Correct, but context matters (e.g. "delay due to border closure"). The note travels with the signal. |
| Exclude event from signal | `reputation.SignalCorrected` { eventId, exclusion reason } | Outside the subject's control, or a safety-motivated decline |
| Correct underlying fact | Compensating event on the source aggregate (e.g. `leg.DepartureTimeCorrected`) + `reputation.SignalCorrected` | Fact was wrong |
| Fix the definition | `reputation.DefinitionRevised` (Administrator) + projection rebuild | Systemic unfairness found |

## Guard-rails

1. No outcome may make a recipient's access to asking conditional. Recipient signals may only change verification depth and routing ([[DP-02 Need Verification]]).
2. No public ranking, leaderboard or badge derived from signals ([[Recognition Anti-Patterns]]).
3. The absence of thanks never lowers a signal. Gratitude can only add.
4. Safety-motivated declines by carriers never count against reliability.
5. A reviewer involved in the contested flows must recuse themselves (`reputation.ReviewerRecused`).
6. Signals are never shared with other organisations without the subject's consent. This includes partners.

## Reversibility and correction

Signals are projections, so corrections rebuild them. The contest and its outcome stay in the log. The subject may request a second review by the Administrator or an independent reviewer ([[Escalation and Disputes#Reputation contestation]]).

## SLA target

Acknowledge ≤ 2 working days. Conclude ≤ 15 working days. While under review, the contested signal is shown as "under review" and is not used in [[DP-05 Routing and Carrier Assignment]] or [[DP-02 Need Verification]].

## Escalation path

Reviewer → Administrator → independent review (trustee or external). See [[Escalation and Disputes]].

## Audit record

Contest volume, outcomes, time to conclude, and definitions revised. Periodic fairness review of signal distributions by role and region ([[Accountability and Audit]]).

## Related notes

[[Reputation]] · [[Reputation Signals]] · [[Reputation Dynamics]] · [[Recognition]] · [[Ethics Charter]]
