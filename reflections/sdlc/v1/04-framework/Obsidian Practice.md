---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, framework, obsidian]
---

# Obsidian Practice

Back to [[00 SDLC Home]].

## Conventions in use
- **Frontmatter on every note:** `type` (moc, adr, iteration, observation, process, review, …), `status`, `date` and `tags`, sometimes `aliases`. ADRs add `spec:`, the spec note they serve.
- **One home note (MOC) per vault:** `00 Home`, `00 ADR Home` and `00 Meta Home`. Every note ends with "Back to" its home.
- **Numbered folders in `spec/`** (`00-meta` … `10-demo-content`, `99-templates`), so the reading order is the folder order.
- **Templates** in every vault (`99-templates/` or `templates/`).
- **Formatting tools:**
  - callouts for principles, privacy, questions and notes (`> [!principle]`, `> [!privacy]`, `> [!question]`, `> [!note]`);
  - Mermaid for flows and sequences;
  - tables for registers.
- **Filenames are identities.** The Vault Map fixed every filename before eight authors wrote in parallel, so their links matched.

## Link discipline
- **Wikilinks stay inside their vault.** Notes in another vault are named by path in backticks, such as `adr/records/ADR-0020 ….md`. Iteration 04 found and fixed cross-vault wikilinks that would not resolve.
- **Link density shows each vault's nature.** `spec/` has 4,714 wikilinks, a dense graph of the domain. `adr/` has 58 and `meta/` has 50; most point to their home notes, and they refer to other notes by path.

## Status lifecycles
| Vault | Statuses |
|---|---|
| `spec/` | draft → review → stable |
| `adr/` | proposed → accepted or accepted-provisional → accepted (amended) or superseded |
| `meta/` | draft → review → done or stable |

## Gaps
- **Nothing checks the vaults.** These are found by eye, if at all:
  - broken links;
  - missing frontmatter;
  - notes missing from a home index;
  - stale statuses (iterations 01 and 03 still say `review`);
  - hand-kept counts in the README.
- **Only `spec/` has an `.obsidian/` configuration** in git. `adr/` and `meta/` open as plain folders.

## Proposal
A `tools/check-vaults.mjs`, the documentation's counterpart to the topology checker. It would check that:
- links resolve within each vault;
- no wikilink crosses vaults;
- frontmatter follows a schema for each `type`;
- every ADR and every iteration appears in its home index;
- the counts in the README are generated.

See [[Automation Backlog]].
