---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, code, topology]
---

# Topology as a Development Tool

Back to [[00 SDLC Home]].

## The shape
| Layer | Group | Packages |
|---|---|---|
| 0 | foundation | kernel, i18n, privacy, identity, settings |
| 1 | record | store, log |
| 2 | river · steward · assist | needs, gifts, flows · config · assist |
| 3 | surface | content, reports, feed, pages |
| 4 | compose | runtime |
| 5 | apps · infra | web · the Pulumi program |

## The rules, and the tool that enforces them
`tools/check-topology.mjs` fails if any of these is broken:
1. Every package has a `gate.ts`.
2. `package.json` exports exactly `{ ".": "./gate.ts" }`.
3. No relative import escapes its package.
4. Imports from other packages go through the gate; there are no deep imports.
5. Every imported package exists.
6. Dependencies point down or sideways, never up.
7. Every imported package is declared.
8. In library packages, outside `types/` and `data/`, a file exports **exactly one value**, named like the file, and no types.
9. There are no cycles.
10. `TOPOLOGY.md` is up to date (regenerated with `--write`).

## How it served development
- **Gates are a cheap index.** To plan the studio in iteration 04, the AI printed the 17 gates, about a screen per package, instead of reading 285 files. For an AI with a finite context, this is the topology's most valuable property.
- **Layers give the building order,** and could give the commit order (see [[Stage 5 — Construction]]).
- **Declarations catch drift at once.** The web app imported `@river/settings`, `@river/identity` and `@river/config` before declaring them, and the checker named each import.
- **New concerns found a place without cycles.** Identity and settings went to layer 0, where every layer can use them. The organisation's stored settings became a new group, `steward`, at layer 2, which took a one-line change to the checker.

## Costs
- **Wide changes.** Generalising the currency touched flows, gifts, reports, pages, feed, runtime and the web app: seven packages for one idea.
- **Many small files** (see [[One Function per File in Practice]]).
- **Package-internal helpers are allowed, but invisible.** Some helpers never reach a gate, such as `costDrafts.ts` in flows, and nothing lists them.

## Verdict
The topology is the project's strongest engineering asset. It makes AI-written code reviewable by rule, and its cost grows with the number of packages, not with their size.
