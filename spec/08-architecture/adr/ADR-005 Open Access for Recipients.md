---
type: adr
status: draft
tags: [adr, architecture, ethics, access, privacy/sensitive]
aliases: [ADR-005, The Left Bank Is Always Open]
related: ["[[Identity and Access]]", "[[Recipient]]", "[[Reputation]]"]
---

# ADR-005 Open Access for Recipients

**Status:** Accepted · **Date:** 2026-09-24 · Back to [[Architecture Overview]]

## Context

People in need, like Olena ([[Audiences and Personas]]), may have old phones, patchy connectivity, no email address, and fear of being judged or tracked. Common anti-abuse measures (mandatory accounts, identity documents, CAPTCHAs, reputation thresholds) would exclude exactly the people the portal exists for. At the same time, the organisation must manage fraud risk, duplicate requests and safeguarding. [[Guiding Principles#P3. The left bank is always open]] and [[Guiding Principles#P2. A need is respected]] are non-negotiable.

## Decision

1. **Anyone can submit a [[Need]] at any time, without an account.** A contact channel (SMS, email or messenger) is enough; the recipient receives a one-time tracking link. Someone may also ask on behalf of others (neighbour, institution).
2. **No gate on access.** [[Reputation]], [[Verification]] status and history never block, delay or deprioritise the *ability to ask*. They influence only **verification depth** ([[DP-02 Need Verification]]) and **routing** ([[DP-01 Need Triage]], [[DP-04 Matching]]).
3. **No rejection state.** If the organisation cannot help, the need is `referred` or `on_hold` with a kind, explained message ([[Need]]).
4. **Abuse is handled downstream:** rate limits, duplicate detection and human review, not CAPTCHAs or account walls. Suspected abuse goes to a human with `on_hold`; nothing is silently discarded.
5. **Triage priority** is computed from declared urgency and waiting time, never from reputation signals ([[Firebase Data Model#Indexes]]).

## Consequences

**Positive**
- Lowest possible barrier for people in hardship; dignity preserved.
- Clear ethical line that coordinators, auditors and the public can check.
- Tracking links work on any phone with SMS and a basic browser.

**Negative**
- More spam and duplicates reach the queue; coordinators need good duplicate-detection tools ([[Coordinator Workspace]]).
- Contact-only identity makes follow-up harder if a phone number changes.
- Tracking links are bearer tokens; if forwarded, someone else may see status (mitigated: minimal content, revocation, expiry, discreet mode).
- Verification must be proportionate and humane, which costs coordinator time.

## Alternatives considered

| Alternative | Why not |
|---|---|
| Mandatory account with phone OTP | Excludes shared phones and people without SMS reliability; adds fear of tracking |
| CAPTCHA on `/ask` | Excludes older and disabled users ([[Accessibility]]) |
| Reputation threshold for repeat requests | Violates P3; punishes need |
| Invitation-only intake via partners | Useful as an additional channel ([[Partner Organisation]]), not as the only one |

## Related
[[Identity and Access]] · [[Help Seeker Section]] · [[Reputation Dynamics]] · [[Ethics Charter]] · [[ADR-006 Private by Default Visibility]]
