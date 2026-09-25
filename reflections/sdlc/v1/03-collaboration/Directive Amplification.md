---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, amplification]
---

# Directive Amplification

Back to [[00 SDLC Home]].

**Amplification** is how much work one directive produces. In this project it is very large, and it shapes everything downstream: review, commits and acceptance.

| Directive | Characters | Output |
|---|---|---|
| M1: specification | 3,298 | 146 notes and about 137,000 words, about 42 words for every character typed |
| M2 + M3: engineering and design | 2,396 | Iterations 01–02: 14 packages, a web app, a Pulumi program and 18 ADRs. Together with iteration 03 they went into one commit of 379 files and 16,341 lines, 7,412 of them the lockfile |
| M4: publication | 810 | README, three licence files, a fact sheet from 30 dated sources, ADR-0019 |
| M5: review | 681 | A 216-line review: site map, blind spots and 8 vectors |
| M6: iteration 04 | 472 | 263 files (+6,193 −870 lines), 4 ADRs, 13 defects found and fixed |

## Consequences
1. **Review cannot go line by line.** The owner accepts on compressed evidence: summaries, screenshots, check results and evaluation tables.
2. **The quality of acceptance is the quality of the evidence.** A misleading screenshot or an optimistic summary would pass. That is why the defect lists and the "what reads badly" sections matter.
3. **Commits inherit the amplification.** One directive becomes one commit of hundreds of files (see [[Commit Style]]).
4. **A small directive can carry a large scope.** The settings registry was one sentence of M6 and became the largest part of the iteration.

## What to do with it
- **Keep the amplification.** It is the point of the method.
- **Make the output navigable:**
  - commits sliced by layer;
  - a pull request that carries the evidence;
  - the iteration note as the reading guide.
- **Measure it** in every iteration (see [[Metrics to Watch]]).
