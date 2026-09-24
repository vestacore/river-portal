---
type: decision
status: draft
tags: [decision, visibility, privacy/sensitive, consent]
aliases: [DP-12, Visibility Change, Clear or Murky Water]
related: ["[[Visibility Policy]]", "[[Visibility Levels]]", "[[Consent]]"]
---

# DP-12 Visibility Change

Back to [[Decision Points Overview]]. Roles: [[Responsibility Matrix]].

> [!privacy] Private by default, narrowing is easy, widening is earned
> Every field carries its own [[Visibility Levels|visibility level]]: `sealed`, `private`, `team`, `participants` or `public`. **Narrowing** (towards `sealed`) is immediate and needs no justification from the subject. **Widening** (towards `public`) requires a lawful basis and, for anything about a person, a matching [[Consent]] ([[ADR-006 Private by Default Visibility]]).

## Question decided

*Should the visibility level of this record, field or [[Media Asset]] change, and for whom?*

## Trigger

- A subject asks to hide something ("remove my village name").
- `consent.Withdrawn` or `consent.Granted` at [[DP-09 Publication Consent]].
- `safeguarding.ConcernRaised`, which triggers sealing.
- An Editor or Coordinator proposes widening for a publication or a partner hand-off.
- A retention rule expires ([[Data Retention]]), which narrows or crypto-shreds.

## Roles

| Direction | Decider (R) | Accountable (A) | Consulted (C) |
|---|---|---|---|
| Narrow (subject request) | The subject. Applied automatically. | Administrator (data protection) | none |
| Narrow (staff, protective) | Coordinator | Lead Coordinator | Subject (informed) |
| **Seal** | Safeguarding Lead | Safeguarding Lead | Administrator |
| Unseal | Safeguarding Lead + second senior (four-eyes) | Administrator | Subject where safe |
| Widen `private` → `team` / `participants` | Lead Coordinator | Lead Coordinator | Subject for identifiable data |
| Widen → `public` | Editor, with in-force consent | Administrator | Safeguarding Lead if vulnerable |
| Share with [[Partner Organisation]] | Lead Coordinator | Administrator | Subject (consent), partner's data agreement |

## Inputs

- Current field-level [[Visibility Policy]] of the record.
- In-force consents and their content hashes.
- Safeguarding flags.
- AI PII detection on the content to be widened (`via: vertex`, advisory). It flags faces, plates, addresses and names in text and images.
- A preview of the record as each audience would see it after the change.

## Options and criteria

| Option | Event |
|---|---|
| Change level | `visibility.Changed` { target, field?, from, to, basis: consent/subjectRequest/safeguarding/retention/operational } |
| Seal | `visibility.Sealed` { target, fields[] } |
| Decline change | `visibility.ChangeDeclined` { reason } (for widening only; a subject's narrowing cannot be declined) |
| Redact media | `mediaAsset.Redacted` { rendition } (face-blur, crop) followed by `visibility.Changed` |
| Erase | `person.KeyShredded` (crypto-shredding): PII becomes unreadable everywhere, and events remain with references only |

## Guard-rails

1. A subject's request to narrow is **never** declined or delayed, except where a legal hold or safeguarding duty requires retention. In that case the data is sealed, not shown.
2. Widening without a basis is blocked by the command API. `public` for person-linked fields requires a consent reference.
3. `sealed` data is never widened by a single person.
4. AI may detect and suggest redactions but may not change a level.
5. Changing visibility never alters the underlying event. It changes which projections may include it.

## Reversibility and correction

Narrowing can be followed by widening only with a fresh basis. Widening can always be reversed by narrowing. Crypto-shredding is **irreversible** by design. Projections rebuild on each `visibility.Changed`, and public CDN caches are purged.

## SLA target

Subject narrowing: immediate in the UI, ≤ 1 hour on public surfaces. Sealing: immediate. Widening: ≤ 5 working days. Erasure request: ≤ 1 month (UK GDPR), target ≤ 5 working days.

## Escalation path

Coordinator → Lead Coordinator → Administrator (data protection lead) → trustees / ICO complaint route. Sealed matters go through the Safeguarding Lead only. See [[Escalation and Disputes#Consent disputes]].

## Audit record

Every change with its basis and actor. Auditors see *that* a change happened and why, never the sealed content itself. Monthly report of widenings to `public` reconciled against consents ([[Accountability and Audit]]).

## Related notes

[[Visibility Levels]] · [[Visibility Policy]] · [[Privacy Model]] · [[Consent Management]] · [[Data Retention]] · [[Security Rules]] · [[Safeguarding]]
