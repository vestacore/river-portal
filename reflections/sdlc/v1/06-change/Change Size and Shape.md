---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, change, size]
---

# Change Size and Shape

Back to [[00 SDLC Home]].

## Where the lines went
| Area | `872ed85` (iterations 01–03) | `ddb01cc` (iteration 04) |
|---|---|---|
| apps/web | 79 files, +2,982 | 84 files, +2,761 −547 |
| packages/foundation | 38, +421 | 44, +1,023 −3 |
| packages/record | 22, +420 | 4, +13 −7 |
| packages/river | 79, +1,351 | 37, +206 −74 |
| packages/steward | — | 10, +157 |
| packages/assist | 9, +158 | — |
| packages/surface | 66, +1,206 | 25, +640 −68 |
| packages/compose | 14, +340 | 22, +572 −135 |
| infra | 18, +439 | 3, +4 |
| tools | 3, +259 | 2, +11 −3 |
| adr | 21, +654 | 7, +227 −4 |
| meta | 17, +412 | 7, +362 −3 |
| spec | 4, +22 −1 | 6, +95 −1 |
| README, TOPOLOGY | +138 (TOPOLOGY; README came in `dbbb9d8`) | +73 −25 |
| lockfile | +7,412 | +49 |

## The shape: wide and shallow
- **Many files, few lines each.** Iteration 04 touched 263 files, but the median function file is 10 lines long. Most changes are a handful of lines in a small file.
- **Growth by addition.** Iteration 04 added 6,193 lines and removed 870. Refactors show up as many small edits and git renames, not as rewrites. Examples: the currency rename, and moving the report and feed pages under *Surface*.
- **Content is a large share.** 1,029 of the added lines (17%) are bilingual content data written by a sub-agent.
- **The app carries the most change,** 45% of iteration 04's added lines, and it has no unit tests.
- **Documentation is a steady share.** Iteration 04 added about 760 lines of ADRs, meta, spec, README and TOPOLOGY, about 14% of the code change.

## Consequences for review
- **Review cost follows the files touched, not the lines changed.** A 263-file change is expensive to review even if each file changes little.
- **Some kinds of change are cheap to review** and could travel in separate commits: the lockfile, generated files, content data, screenshots.
- **Some deserve the closest reading:**
  - domain rules;
  - privacy code;
  - authentication (`proxy.ts`, sessions);
  - Server Actions.

See [[Commit and Branch Policy]] for the size budgets that follow from this.
