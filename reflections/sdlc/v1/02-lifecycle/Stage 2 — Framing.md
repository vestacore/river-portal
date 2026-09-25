---
type: stage
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, stage, framing]
---

# Stage 2 — Framing

Up: [[The Lifecycle as Observed]] · Previous: [[Stage 1 — Intent]] · Next: [[Stage 3 — Specification]]

## Purpose
Turn a directive into an iteration: goal, scope, order of work, and what counts as done.

## What happens
- The AI chooses the scope and order of work. Iteration 04 was built bottom-up by layer:
  1. registry;
  2. identity;
  3. domain;
  4. pages;
  5. studio;
  6. verification;
  7. documentation.
- Open questions are answered with the **nearest sensible variant** and written into a register (16 rows at iteration 04).
- Debts taken on purpose go into the **Technical Debt Register**, each with a trigger for repaying it (22 items).
- The only explicit planning document so far is the review before iteration 04: eight vectors with their value and size.

## Evidence
- `meta/reviews/2026-09-25 Site Map and Domain Review.md` proposed "V1 + V4 + quick wins of V5". The owner accepted it in one line and added a constraint of their own.
- Iteration 01 wrote a definition of done at the start: runs locally, `npm run check`, `pulumi preview`. Iteration 04 wrote its goal and evaluation at the end.
- There was one context compaction in iteration 04 (13:51). The plan survived as a list of pending tasks in the summary, not as a file.

## Exit
Implicit: the first tool call of construction.

## Weak spots
- **The plan lives in the AI's working memory** until the iteration note is written at the end. The owner cannot see or correct it during the iteration.
- **No estimate or budget.** An iteration's size is discovered, not agreed: iteration 04 changed 263 files.

## Proposal
Write the skeleton of the iteration note **first**:
- goal and scope;
- planned slices (by layer);
- definition of done;
- evidence to be delivered.

Tick it off during the work and complete it with the evaluation at the end. The note then doubles as a plan that survives compaction. See [[Checklists]].
