---
type: stage
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, stage, review]
---

# Stage 9 — Review and Re-vectoring

Up: [[The Lifecycle as Observed]] · Previous: [[Stage 8 — Acceptance and Release]]

## Purpose
Step back from construction, compare the product with the domain, and choose the next direction.

## What happens
- **The domain review (M5)** produced four things:
  - a textual site map as built;
  - how the sections relate;
  - role coverage;
  - blind spots grouped by theme, and eight **vectors** (V1–V8), each with its value and size.

  The owner chose "V1 + V4 + quick steps of V5" and added a constraint of their own, the settings registry. That pulled part of V7 ("template-ness") forward.
- **Evaluation by profile (iteration 04)** makes review a standing practice. The same code is compared as three organisations side by side, with a table of what works and what reads badly. In the owner's words: "that is how we will test and evaluate from now on".

## Evidence
- The review took 4 minutes of AI time and was accepted within 5 minutes. Per minute, it is the most valuable note in the project.
- The profile evaluation found problems of *meaning*, not correctness:
  - a 38% delivery-cost share that reads as overhead for a transport fundraiser;
  - demo data that does not simulate scale;
  - pseudonymisation that hides little when an organisation serves a single oblast.

## Weak spots
- **Reviews happen only when the owner asks** for them; there is no rhythm.
- **Open questions pile up in two places**, the spec's Open Questions (30 open) and the nearest-variant register (16), and nothing brings them back to the owner.

## Proposal
Hold a review after every two iterations, or whenever a hard gate is about to close. Its inputs:
- the profile screenshot matrix;
- the triggers of debts and assumptions that have fired;
- open questions older than the last review.

See [[Checklists]].
