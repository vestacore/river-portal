---
type: decision
status: draft
tags: [decision, consent, publication, privacy/sensitive, tier/1]
aliases: [DP-09, Publication Consent]
related: ["[[Consent]]", "[[Consent Management]]", "[[Publication Pipeline]]"]
---

# DP-09 Publication Consent

Back to [[Decision Points Overview]]. Roles: [[Responsibility Matrix]].

> [!principle] Consent is specific and revocable
> [[Guiding Principles#P5. Consent is specific and revocable|P5]]: one consent covers one purpose, one audience and one piece of content. It is freely given, can be withdrawn at any time, and withdrawal removes the item from every publication. Consent is **never** a condition of help ([[Guiding Principles#P1. A gift is a gift|P1]]).

## Question decided

*May this specific story, quote, photo, name or other identifying detail be used for this purpose, at this [[Visibility Levels|visibility level]], in these languages?*

Unlike every other DP, **the decider is the person the content is about**, not staff.

## Trigger

- An Editor or Coordinator wants to use identifiable content in a [[Publication]] ([[Journey Story]], [[Gratitude Wall]], [[Campaign Page]], [[Donor Report]] shared publicly).
- A giver or sponsor wants to be named publicly.
- A [[Media Asset]] is uploaded with a person in it.

## Roles

| RACI | Role |
|---|---|
| **Decider (R)** | The subject: [[Recipient]], [[Giver]], [[Carrier]], [[Volunteer]]. For minors or people without capacity: guardian or responsible institution, with Safeguarding Lead review. |
| **Accountable (A)** | Editor, for asking properly and recording faithfully; Safeguarding Lead for any minor or `sealed` subject |
| **Consulted (C)** | Coordinator who knows the person (right channel, right moment, right language) |
| **Informed (I)** | Editor and Lead Coordinator (outcome) |

## Inputs: what the person sees before deciding

1. **Exact preview** of the content as it will appear to the target audience, in their language (uk or en-GB), with redactions applied.
2. **Purpose** in plain words ("a story on our website about how the generator reached your village").
3. **Audience**: `participants` (the people who helped) or `public`.
4. **Duration**, and how to withdraw (link, SMS keyword, or telling their coordinator).
5. What stays private whatever they choose.

AI may draft the consent explanation in the person's language. A human reviews it before it is sent ([[Vertex AI Integration]]).

## Options

| Option | Event | Effect |
|---|---|---|
| Grant (as previewed) | `consent.Granted` { scope, audience, contentHash, expiresOn } | Content may be published at that level |
| Grant with changes | `consent.Granted` { conditions: e.g. "no face", "first name only", "village not named" } | Editor adapts and re-previews if materially changed |
| Decline | `consent.Declined` | Content stays private. No reminder is sent for at least 90 days. |
| No answer | none (`consent.Requested` expires after 14 days) | Treated as **not granted** |
| Withdraw later | `consent.Withdrawn` | Projections remove or redact from live pages within 15 minutes ([[Canonical Parameters]], [[DP-12 Visibility Change]]) |

## Guard-rails

1. Silence is never consent, and pre-ticked boxes are forbidden.
2. Consent is never requested in the same message as delivery confirmation or while help is pending. Timing is chosen so the person does not feel it is a price.
3. Consent is bound to a **content hash**. A material edit requires fresh consent.
4. Staff cannot grant consent on someone's behalf. A proxy is only recorded with a documented relationship (guardian, institution).
5. Aggregated, anonymised content, such as "42 families in Kharkiv oblast", does not need personal consent. It is checked at [[DP-10 Report Publication]] for re-identification risk.

## Reversibility and correction

Always revocable. Withdrawal appends `consent.Withdrawn`. Projections rebuild and remove the item from the [[Public Portal]]. Cached renditions are purged from CDN, and printed or third-party copies are listed for best-effort follow-up. The original consent event remains as a record that publication was lawful at the time.

## SLA target

No deadline pressure on the subject. Withdrawal takes effect on live pages within 15 minutes, without human action.

## Escalation path

Subject → coordinator or Editor → Safeguarding Lead (minors, risk) → Administrator (data protection lead). Disputes: [[Escalation and Disputes#Consent disputes]].

## Audit record

Consent registry: each publication item links to the consent events it relies on. Auditors can verify that every identifiable item on the public site has an in-force consent ([[Accountability and Audit#Audit views]], [[Consent Management]]).

## Related notes

[[Consent]] · [[Consent Management]] · [[Publication Pipeline]] · [[Privacy Model]] · [[Safeguarding]] · [[Media Asset]]
