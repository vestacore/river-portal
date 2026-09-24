---
type: decision
status: draft
tags: [decision, publication, report, content, vertex, tier/1]
aliases: [DP-10, Report Publication]
related: ["[[Publication]]", "[[Publication Pipeline]]", "[[Report]]"]
---

# DP-10 Report Publication

Back to [[Decision Points Overview]]. Roles: [[Responsibility Matrix]].

> [!principle] The surface shows the depths honestly
> Every figure in a publication is a **live data block** derived from [[Projection]]s, not a typed number ([[Guiding Principles#P8. Honest numbers, beautifully shown|P8]]). Every identifiable detail rests on an in-force [[Consent]] ([[Guiding Principles#P4. Private by default|P4]]). Nothing is published by AI.

## Question decided

*Is this [[Publication]] accurate, consented, dignified, correctly translated and safe to show to its intended audience now?*

## Trigger

- `flow.Confirmed` for a report or [[Journey Story]], or a campaign milestone for a [[Campaign Page]].
- A scheduled [[Impact Report]], [[Donor Report]] batch or [[Newsletter Digest]].
- `publication.SubmittedForReview` from a coordinator or Editor.

## Roles

| RACI | Role |
|---|---|
| **Decider (R)** | Editor |
| **Accountable (A)** | Lead Coordinator for flow- or campaign-level items; Administrator for org-wide items (impact reports, ledger statements) |
| **Consulted (C)** | Finance Steward (any money figures); Safeguarding Lead (any content about vulnerable people); translator or reviewer for each locale |
| **Informed (I)** | Participants of the Flow (a new story about their journey); subscribed givers |

## Inputs

- Draft structured-block content from the [[Content Editor]], per locale ([[Translation]]).
- Live data blocks: counters, ledger excerpt, journey timeline, [[Flow Map]].
- Consent check: every identifiable block linked to `consent.Granted` with matching content hash ([[DP-09 Publication Consent]]).
- Re-identification check for aggregates, e.g. no "1 family in a village of 40 people".
- Ledger status: costs approved and reconciled ([[DP-06 Cost Approval]]).
- AI drafts: story draft, summary, uk↔en-GB translation drafts, PII-detection warnings (`via: vertex`).

## Pre-publication checklist

| Check | Blocking? |
|---|---|
| All identifiable content has in-force consent for this audience | Yes, enforced by the pipeline |
| Money figures come from live blocks, and costs are reconciled | Yes for public ledger excerpts |
| Both locales human-reviewed (no unreviewed machine translation) | Yes for `public` |
| PII scan clean, or warnings explicitly resolved | Yes |
| Aggregates above the minimum cell size (default k ≥ 5) | Yes |
| Tone review against [[Brand and Tone of Voice]]: agency, not pity | Advisory, Editor's judgement |
| Chain of people credited, not a single hero or donor | Advisory |

## Options and outcomes

| Option | Event |
|---|---|
| Approve and publish now | `publication.Approved`, `publication.Published` { audience, locales, contentHash } |
| Schedule | `publication.Scheduled` { at } |
| Return for changes | `publication.ChangesRequested` { notes } |
| Publish to `participants` only | `publication.Published` { audience: participants } |
| Mark flow reported | `flow.Reported` (after the flow's report is published) |

## Guard-rails

1. **AI never publishes.** A publish command with `via: vertex` is rejected.
2. No figure may be typed in by hand where a live block exists. Manual figures need a cited source and Finance Steward sign-off.
3. No donor league tables, amount-ranked lists or "top givers" ([[Recognition Anti-Patterns]]).
4. The Editor cannot override a missing consent. The fix is to remove or anonymise the content.
5. The author of a publication should not be its only approver for `public` org-wide items (four-eyes).

## Reversibility and correction

`publication.Withdrawn` { reason } removes the item from the site. `publication.Revised` { changeNote } publishes a new version with a visible correction note. Consent withdrawal triggers automatic redaction and republishing of the affected blocks.

## SLA target

Flow report ≤ 10 working days after `flow.Confirmed`. Tier 1 campaign report ≤ 5 working days after the last delivery. Corrections of factual errors ≤ 2 working days.

## Escalation path

Editor → Lead Coordinator → Administrator. Complaints about published content go to [[Escalation and Disputes]]. Content harming a person is withdrawn first and reviewed afterwards.

## Audit record

Every published version with content hash, approvers, the consents relied on, and the projection snapshot IDs behind each live block, so a figure can be traced back to the events ([[Accountability and Audit]]).

## Related notes

[[Publications Overview]] · [[Publication Pipeline]] · [[Transparency Ledger]] · [[Impact Report]] · [[Content Management]] · [[Multilingual Experience]]
