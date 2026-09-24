---
type: adr
status: draft
tags: [adr, architecture, privacy, visibility, privacy/sensitive]
aliases: [ADR-006]
related: ["[[Visibility Levels]]", "[[Visibility Policy]]", "[[Privacy Model]]"]
---

# ADR-006 Private by Default Visibility

**Status:** Accepted · **Date:** 2026-09-24 · Back to [[Architecture Overview]]

## Context

The portal publishes a great deal — [[Journey Story|Journey Stories]], the [[Transparency Ledger]], the [[Flow Map]], the [[Gratitude Wall]] — built from records about real people, some in danger. Different audiences legitimately need different slices of the same record: a carrier needs a hand-over point, a giver wants to know their gift arrived, the public wants honest totals, a Safeguarding Lead needs sensitive notes. Record-level access control is too coarse, and ad hoc redaction in UI code is error-prone. [[Guiding Principles#P4. Private by default]] and [[Guiding Principles#P5. Consent is specific and revocable]] apply.

## Decision

1. Adopt the five canonical [[Visibility Levels]]: `sealed`, `private`, `team`, `participants`, `public`.
2. **Every field carries a level**; the default for anything touching a person is `private`. Event types declare a default level and per-field overrides ([[Event Catalogue]]).
3. **Redaction happens in projections**, once, in shared code (`redactFor(audience)` in `packages/domain`), never in UI components. Where Firestore rules must enforce it, projections split documents per level ([[Security Rules#Level-split views]]).
4. `participants` views are **pseudonymised** by default ("a family in Kharkiv oblast").
5. `public` data is **aggregated and anonymised** (k-anonymity thresholds, location coarsened to oblast) unless a specific, active [[Consent]] allows identifiable content.
6. Raising visibility is a decision ([[DP-12 Visibility Change]]) recorded as `visibility.Changed`; revoking consent lowers it automatically and unpublishes dependent content.

## Consequences

**Positive**
- Safe by default: forgetting to set a level results in less exposure, not more.
- One tested redaction path for all surfaces; auditable changes of visibility.
- Enables rich public storytelling without compromising people.

**Negative**
- More projection documents (per-level splits) and more projector logic.
- Some public numbers are suppressed or rounded for small counts, which may frustrate small campaigns.
- Editors must obtain specific consents to publish identifiable stories; storytelling takes longer.

## Alternatives considered

| Alternative | Why not |
|---|---|
| Record-level ACLs only | Cannot show a carrier the hand-over point without the whole record |
| Public by default with opt-out | Violates P4; unsafe for recipients in conflict areas |
| Redaction in UI components | Duplicated, easy to miss; data would still reach the browser |

## Related
[[Privacy Model]] · [[Consent Management]] · [[Data Minimisation]] · [[Firebase Data Model]] · [[ADR-005 Open Access for Recipients]] · [[DP-09 Publication Consent]]
