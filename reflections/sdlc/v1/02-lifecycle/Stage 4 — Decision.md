---
type: stage
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, stage, decision]
---

# Stage 4 — Decision

Up: [[The Lifecycle as Observed]] · Previous: [[Stage 3 — Specification]] · Next: [[Stage 5 — Construction]]

## Purpose
Record *how* the portal is built, which alternatives were rejected, and which consequences were accepted.

## What happens
- **23 ADRs in about 26 hours:** 17 in iteration 01, 1 in iteration 02, 1 in iteration 03 and 4 in iteration 04, plus two amendments. Each has a context, a decision, its consequences and the alternatives considered.
- **Statuses:**
  - `accepted`;
  - `accepted-provisional`, where a decision rests on an open product question (ADR-0011, ADR-0016, ADR-0017);
  - `accepted (amended)`, where a later ADR changes part of it (ADR-0005 by ADR-0018; ADR-0006 and ADR-0010 by ADR-0022).
- **An old ADR is never rewritten.** It gets a dated note pointing to the newer decision.
- **Many ADRs are written as-built.** ADR-0020 to ADR-0023 were written after the code existed and had passed verification, so they include what testing found. ADR-0022, for instance, records the Tiptap serialisation defect.

## Evidence
- `adr/00 ADR Home.md` indexes all 23 records with status and area.
- Code comments cite ADRs by path (`adr/records/ADR-0021`), which ties code to its decisions.
- The licensing decision (ADR-0019) resolved two inconsistencies in the owner's request, "MIT" against Apache 2.0 and CC BY against non-commercial, and recorded the reasoning.

## Weak spots
- **Decisions are rarely reviewed before they take effect.** The owner sees most ADRs only after the code is written. That is fine for reversible, internal choices. It is risky for outward-facing or hard-to-reverse ones: licensing, the data model, authentication, deployment, and anything that touches personal data.
- **ADRs do not appear in commits,** so `git log` cannot tell which commit carried which decision.

## Proposal
- **Two tracks.** An ADR for an irreversible or outward-facing choice is first written as `proposed` and shown in the restatement (see [[Stage 2 — Framing]]). Internal choices may stay as-built.
- Every commit that implements a decision names it in a `Refs:` trailer (see [[Commit and Branch Policy]]).
