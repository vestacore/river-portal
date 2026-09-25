---
type: proposal
status: proposed
version: v1
date: 2026-09-25
tags: [sdlc, proposal, commits]
---

# Commit and Branch Policy

Back to [[00 SDLC Home]]. A proposal for the owner, not yet agreed.

## Branches
- `main` holds accepted iterations only.
- One branch per iteration, for example `iteration/05-left-bank-visible`.
- One pull request per iteration, carrying the evidence:
  - check output;
  - the screenshot matrix;
  - the route matrix;
  - links to the iteration note and the ADRs.
- **Merge with a merge commit, not a squash,** so the slices stay in history and the merge commit marks acceptance.

## Commits
- **Conventional Commits with the package as scope:** `feat(settings): …`, `refactor(flows): …`, `fix(privacy): …`, `docs(adr): …`, `test(runtime): …`, `chore(deps): …`.
- **One slice per commit, following the layers:** foundation → record → river and steward → surface → compose → app → infra → docs.
- **A body that says why, and trailers that point to the records:**

```
feat(settings): registry of typed settings with floors and profiles

Every parameter an organisation may change is now a typed setting with
validation; profiles preset values for three kinds of organisation.

Refs: ADR-0020, Iteration 04, spec Canonical Parameters
Co-Authored-By: Claude <noreply@anthropic.com>
```

- **Separate commits for material that needs little review:**
  - the lockfile;
  - generated files (`TOPOLOGY.md`);
  - content data;
  - screenshots.
- **A size guideline:** up to about 400 changed lines of code per commit, not counting data, the lockfile and generated files. A larger slice says why in its body.

## Iteration 04 re-cut, as an example
| # | Commit |
|---|---|
| 1 | `feat(identity): roles, identities and signed sessions` |
| 2 | `feat(settings): settings registry, validation, tokens and three profiles` |
| 3 | `feat(settings): bilingual texts of the three profiles` (data) |
| 4 | `feat(config): settings stored as events` |
| 5 | `refactor(log,flows,gifts,reports,pages,feed): reporting currency and recorded rates` |
| 6 | `feat(flows): DP-06 capacity in approveCost; carrier costs` |
| 7 | `feat(content): page texts and tokens` (data) |
| 8 | `feat(runtime): personas, demo variants, walkable seed` |
| 9 | `feat(web): identity, demo sign-in and My river` |
| 10 | `feat(web): trust pages, doors, trust strip, quick exit` |
| 11 | `feat(web): studio by river stages; settings form; site texts editor` |
| 12 | `fix(web,privacy,config): 13 defects found by the walk` |
| 13 | `feat(infra): starting profile and several roles per staff member` |
| 14 | `docs: ADR-0020–0023, iteration 04, spec appendices, README` |

Fourteen readable steps instead of one commit of 263 files, with the same point of acceptance.

## Who commits
The working agreement stays: the AI commits only when asked. Under this policy the owner may ask the AI to commit the slices on the iteration branch, and keep the merge into `main` as their own act of acceptance.
