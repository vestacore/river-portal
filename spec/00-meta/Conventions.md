---
type: meta
status: stable
tags: [meta, conventions]
---

# Conventions

How notes in this vault are written, named and linked. Back to [[00 Home]].

## Language

- All specification and development documentation is written in **British English**: *organisation, programme, catalogue, colour, behaviour, licence (noun), prioritise, centre, travelling, acknowledgement, cheque*.
- Dates: ISO 8601 (`2026-09-24`) in data; `24 September 2026` in prose.
- Currency: always state the ISO code (`GBP`, `EUR`, `UAH`, `USD`). The system is multi-currency — see [[Cost Record]].
- Demo content is written in **en-GB and Ukrainian (uk)**, side by side — see [[Demo Content Overview]].
- Tone: clear, warm, dignified, positive. Never pitying, never sensational. See [[Brand and Tone of Voice]].

## Naming

- One concept = one note. Note filenames are **unique across the vault** so that `[[wikilinks]]` resolve without paths.
- Entity notes use the **singular business noun** in Title Case: `Need`, `Gift`, `Consignment`.
- The river metaphor is carried in `aliases`, not filenames (e.g. [[Reputation]] has alias *The Current*).
- Decision points: `DP-NN Title` (e.g. [[DP-04 Matching]]).
- Architecture decision records: `ADR-NNN Title` (e.g. [[ADR-001 Event-Sourced Append Log]]).
- Event types: `PastTenseVerbPhrase` in `PascalCase`, namespaced by aggregate — `need.Submitted`, `consignment.Dispatched`. See [[Event Catalogue]].
- Code identifiers (collections, fields) are `camelCase`; collections are plural (`needs`, `consignments`).

## Frontmatter

Every note starts with YAML frontmatter:

```yaml
---
type: business | entity | relationship | form | publication | achievement | decision | architecture | adr | privacy | demo | meta | moc | template
status: draft | review | stable | superseded
tags: [ ... ]
aliases: [ ... ]        # optional
related: ["[[...]]"]    # optional, for Dataview
---
```

## Linking

- Link **generously** on first mention of any concept that has its own note.
- Every note links back up to its section index (MOC).
- Only link to notes listed in [[Vault Map]]. If a new note is needed, add it to the Vault Map in the same change.
- Use Mermaid for diagrams (Obsidian renders it natively).

## Tags

| Tag | Meaning |
|-----|---------|
| `#entity/people`, `#entity/flow`, `#entity/trust`, `#entity/content`, `#entity/system` | Entity groups |
| `#privacy/sensitive` | Note describes personal or special-category data |
| `#tier/1` … `#tier/4` | Relevant to a [[Scaling Tiers]] tier |
| `#open-question` | Contains an unresolved question — also listed in [[Open Questions]] |
| `#vertex` | Touches AI assistance via Vertex AI |

## Callouts

- `> [!principle]` — a link to a [[Guiding Principles]] item
- `> [!privacy]` — privacy or visibility rule
- `> [!decision]` — a decision point, linked to its DP note
- `> [!question]` — open question
