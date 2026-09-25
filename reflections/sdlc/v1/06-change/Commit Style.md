---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, change, commits]
---

# Commit Style

Back to [[00 SDLC Home]].

## The history so far
| Commit | When (EEST) | Message | Files | Lines | What it holds |
|---|---|---|---:|---|---|
| `ab41599` | 24 Sep 17:35 | initial commit | 150 | +14,631 | The specification vault |
| `dbbb9d8` | 25 Sep 13:13 | add: license and docs | 15 | +631 | README, licences, notice, contributing, security, ignore files, fact sheet |
| `872ed85` | 25 Sep 13:14 | add: initial design implementation | 379 | +16,341 −1 | Iterations 01–03: packages, web app, infra, tools, ADR-0001–0019, meta; 7,412 lines of lockfile |
| `ddb01cc` | 25 Sep 17:17 | add: deepening of the functional | 263 | +6,193 −870 | Iteration 04 and the review |

## Characteristics
- **The owner authored every commit.** The AI has not been asked to commit.
- **One type for everything.** A lower-case `add:` prefix, as in Conventional Commits, is used for a vault, for documentation and licences, for a first implementation and for a refactor.
- **Subject only.** No body, no reference to an iteration or ADR, no co-author trailer for AI-written changes.
- **A commit is an acceptance point.** Each closes one or more phases of the dialogue, and each is a tested state: the checks passed before the owner committed.
- **One split by concern.** Documentation and implementation were committed separately, one minute apart.

## What this style does well
- The history reads as **milestones**, in four lines.
- There are **no broken intermediate states**, because there are no intermediate states.

## What it costs
- **`git blame` explains nothing.** 263 files point to "add: deepening of the functional".
- **Bisecting is useless.** A regression inside iteration 04 cannot be narrowed below 6,193 lines.
- **Reverting one decision is surgery.** The redaction change, the header layout or the settings semantics cannot be undone on their own.
- **Review is impossible at this grain.** Nobody reads a 263-file diff, so review falls back on evidence.
- **The *why* lives elsewhere,** in ADRs and iteration notes, and git does not point there.

## Interpretation
The style fits the owner's role as the **acceptor of iterations**, and the AI's speed: one directive, one iteration, one commit. It does not fit a future with more contributors, a public repository that people will learn from, or regressions that must be located. [[Commit and Branch Policy]] proposes a way to keep the milestones and add the grain.
