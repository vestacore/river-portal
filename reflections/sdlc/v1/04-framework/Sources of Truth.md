---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, framework, truth]
---

# Sources of Truth

Back to [[00 SDLC Home]].

Each fact is decided in exactly one place. Everything else quotes it or is generated from it.

| Fact | Decided in | Projected to | Enforced by |
|---|---|---|---|
| Thresholds, delays, floors | `spec/00-meta/Canonical Parameters.md` | Defaults and floors in the settings registry; profile values | Registry validation (floors, contrast); unit tests |
| Event names | `spec/08-architecture/Event Catalogue.md` | Event types in commands and projectors | Naming rules only; not checked |
| Package structure | `package.json` and `gate.ts` of each package | `TOPOLOGY.md` (generated) | `tools/check-topology.mjs`, which fails if the file is stale |
| Dependencies | `package.json` and the lockfile | `meta/process/Dependency Register.md` | `sfw` and `npm audit`; the register is kept by hand |
| Decisions | `adr/records/` | Code comments, README | By convention |
| Ways of working | `meta/process/Working Agreements.md` | The AI's behaviour and its private memory | By convention |
| Open product questions | `spec/00-meta/Open Questions.md` | `meta/process/Nearest-Variant Assumptions.md` | By convention |
| Debts | `meta/process/Technical Debt Register.md` | The README's "before real use" | By convention |
| Organisation parameters at runtime | The settings registry and stored `settings.*` events | Every page, through `{{tokens}}` | Code: the registry and the domain rules |

## Observations
- **Generated projections never drifted.** `TOPOLOGY.md` was always current, because the checker fails otherwise.
- **Hand-kept projections did drift.** The README's counts, the register rows and the statuses of iteration notes all needed manual passes.
- **The spec's parameters reached the code through a registry.** "Numbers in a note" became validated values with floors. The source of truth now spans vault and code: the note decides, the registry enforces.

## Proposal
Generate more of the projections, and check the rest (see [[Obsidian Practice]]).
