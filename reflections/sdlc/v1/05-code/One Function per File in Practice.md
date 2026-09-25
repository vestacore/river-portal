---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, code, granularity]
---

# One Function per File in Practice

Back to [[00 SDLC Home]].

## Measured at `ddb01cc` (library packages only)
| Kind of file | Count | Lines |
|---|---|---|
| Function files (one exported function or value) | 150 | median 10, 90th percentile 51, largest 139 (`seedDemo.ts`) |
| Type files (`types/`) | 98 | — |
| Data files (`data/`) | 9 | 1,314 in total, mostly bilingual content |
| Gates | 17 | — |
| Test files | 13 | 418 in total; 26 tests |

## What it does for AI development
- **Precise reading.** One file answers one question. Reading `approveCost.ts` costs about 25 lines of context, not a 600-line service.
- **Safe parallel work.** Two writers, human or AI, rarely touch the same file.
- **Findable by name.** A function lives where its name says, so search is rarely needed.
- **Honest interfaces.** Anything used across packages must pass through a gate, so the gate *is* the public API.

## What it costs
- **Navigation for people.** There are 285 files in 17 packages; without the gates and `TOPOLOGY.md` a newcomer would be lost.
- **Wide diffs.** A rename touches many small files, so a commit looks bigger than it is (see [[Change Size and Shape]]).
- **The rule stops at the app.** `apps/web` follows Next.js conventions: the studio's Server Actions file exports about 20 actions, and pages combine data loading with markup. The checker exempts apps and infra on purpose.

## Verdict
For code written and read mainly by an AI, the rule pays off: small, named, indexed units are the right grain for an agent's context. People need the index (gates, TOPOLOGY) to keep it usable.
