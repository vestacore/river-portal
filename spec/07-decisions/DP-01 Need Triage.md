---
type: decision
status: draft
tags: [decision, need, left-bank, tier/2, vertex]
aliases: [DP-01, Need Triage, Triage]
related: ["[[Need]]", "[[Lifecycle of a Need]]", "[[DP-02 Need Verification]]"]
---

# DP-01 Need Triage

Back to [[Decision Points Overview]]. Roles: [[Responsibility Matrix]].

> [!principle] Guard-rail above everything
> Triage decides **how and how fast** a [[Need]] travels. It can **never** decide that a person may not ask. There is no "rejected" state ([[Guiding Principles#P3. The left bank is always open|P3]], [[ADR-005 Open Access for Recipients]]).

## Question decided

*How urgent is this need, what form of help does it describe, which programme or partner is best placed to meet it, and what is the next step?*

## Trigger

- `need.Submitted` appended (web form, studio intake on behalf of someone, partner referral, or API).
- Re-triage: recipient edits the need (`need.Amended`), a hold expires, or a coordinator requests it.

## Roles

| RACI | Role |
|---|---|
| **Decider (R)** | [[Coordinator]] on the intake rota for the programme |
| **Accountable (A)** | Lead Coordinator of the [[Programme]] (or the organisation's intake lead at Tier 2) |
| **Consulted (C)** | Safeguarding Lead if any safeguarding indicator is present ([[Safeguarding]]); [[Partner Organisation]] before a referral |
| **Informed (I)** | [[Recipient]] (always, in their language and chosen channel) |

## Inputs

| Input | Source | Visibility |
|---|---|---|
| Need description, form of help, quantity, location (oblast/hromada level for routing) | `need.Submitted` payload + `people/{personId}/private` | `private` |
| [[Intent Statement]] (optional) | Recipient | `private` |
| On-behalf-of indicator (neighbour, institution, guardian) | Form | `private` |
| Open needs nearby, programme capacity, stock at [[Hub]]s | `views/triageQueue`, `views/hubStock` | `team` |
| Previous needs from the same person (count and outcomes only) | Projection | `team` |
| AI suggestions: summary, [[Category]], urgency, detected PII, translation draft | [[Vertex AI Integration]] (`via: vertex`) | `team`, flagged as suggestion |

Reputation signals are **not** shown on the triage screen. They first appear at [[DP-02 Need Verification]], and even there only to choose verification depth.

## Options and criteria

| Option | Resulting status | Use when | Principle |
|---|---|---|---|
| **Open** | `triaged` → `open` | The need is in scope and can be met by the organisation's own flows | P2 |
| **Open — urgent** | `open` + `urgency: urgent` | Risk to life, health, heating in winter, a child or older person without essentials | P2 |
| **Ask to clarify** | stays `acknowledged` | Form, quantity or location is unclear. One kind question at a time, with an example. | P6 — clarity helped, never demanded |
| **Refer** | `referred` | Another service or [[Partner Organisation]] is better placed (e.g. medical, legal, evacuation). A warm handover with a named contact, not a link dump. | P2, P3 |
| **Hold** | `on_hold` (kind: `no_capacity`, `seasonal`, `awaiting_stock`, `awaiting_recipient`) | The need is valid but cannot be met now. A review date is set. | P3 |
| **Flag safeguarding** | `open` or `on_hold` + visibility `sealed` for flagged fields | Any indicator of abuse, exploitation, a minor alone, or trafficking | [[Safeguarding]] |

Criteria are published internally as a triage rubric. They cover urgency, the form of help, and whether the need is in the programme's scope. **Worthiness is never a criterion.**

**Queue priority = declared urgency + waiting time.** Nothing else orders the queue: never [[Reputation]], never the size of an expected gift, never how the need might look in a publication. A need that has waited longer rises in the queue until someone acts on it.

## Outputs and events

- `need.Acknowledged`: automatic within one hour. The recipient gets a tracking link.
- `need.Triaged` { urgency, categoryId, programmeId, rubricVersion, reason }
- `need.Opened` · `need.ClarificationRequested` · `need.Referred` { partnerOrgId | externalServiceRef, handoverNote } · `need.PutOnHold` { kind, reviewOn }
- `safeguarding.ConcernRaised` { needId }: fields go to `sealed`, and the Safeguarding Lead is notified by Pub/Sub ([[Notifications]])
- `ai.SuggestionAccepted` / `ai.SuggestionRejected` { suggestionId, fieldsChanged }: records whether a human accepted the AI suggestion

## Guard-rails: what must never be decided here

1. A need may not be refused, deleted, hidden from the recipient, or marked "not genuine". Doubt about a claim is handled at [[DP-02 Need Verification]].
2. Urgency may not be lowered because of reputation, nationality, religion, language, or how "sympathetic" the story is.
3. A referral must never be a dead end. The recipient keeps the tracking link, and the need can be re-opened by them or by us.
4. The AI urgency suggestion can only **raise attention**. A human must confirm any urgency level, and the model may not downgrade a human's choice.
5. No publicity, testimonial or photo may be requested as a condition ([[Guiding Principles#P1. A gift is a gift|P1]]).

## Reversibility and correction

Fully reversible. Re-triage appends a new `need.Triaged` that supersedes the earlier one in projections. `need.Resumed` returns a `referred` or `on_hold` need to `open`. Holds past `reviewOn` return to the triage queue automatically (`system` actor).

## SLA target

| Step | Target | Breach behaviour |
|---|---|---|
| Acknowledge | ≤ 1 hour (automatic) | Alert to [[Observability]] |
| Triage (standard) | ≤ 2 working days | Queue item turns amber, then goes to the Lead Coordinator |
| Triage (urgent indicators) | Same day, ≤ 4 hours in working hours | Page the on-call coordinator |
| Hold review | On `reviewOn`, maximum 30 days | Returns to queue |

## Escalation path

Intake coordinator → Lead Coordinator (programme) → Safeguarding Lead (safeguarding only) → Administrator. A recipient who disagrees with a referral or hold uses the complaint route in [[Escalation and Disputes#Complaints from recipients]].

## Audit record

The triage view stores the rubric version, the AI suggestion shown (hash + summary), the human choice, and the time from `need.Submitted` to `need.Triaged`. Auditors can sample hold and referral reasons for bias ([[Accountability and Audit#Audit views]]).

## Related notes

[[Lifecycle of a Need]] · [[Help Seeker Section]] · [[Coordinator Workspace]] · [[Recipient]] · [[Data Minimisation]] · [[Event Catalogue]]
