---
type: moc
status: stable
version: v1
date: 2026-09-25
tags: [moc, sdlc, reflection]
aliases: [SDLC Home]
---

# SDLC of River Portal: Reflection v1

This vault describes how River Portal is actually being built. It draws on four sources:
- the source code;
- the git history;
- the dialogue between the owner and the AI;
- the three Obsidian vaults that direct the work.

Written by the AI (Claude) at the owner's request on 25 September 2026, after iteration 04 (commit `ddb01cc`).

> [!abstract] Five findings
> 1. **Documentation leads, code follows.** About 155,000 words in `spec/`, `adr/` and `meta/` stand against 11,701 lines of code. The vaults are the source; the code behaves like a projection of them. See [[Three Vaults as Working Memory]].
> 2. **Human attention is the bottleneck.** About four hours of AI construction were spread over 25½ hours of elapsed time. The owner's directives and commits set the pace. See [[Timeline of Milestones]].
> 3. **Rules stand in for review.** No second person reads the code. Types, the topology checker, tests and a browser walk through every role carry the review, and the walk finds what the rest cannot. See [[The Verification Ladder]].
> 4. **Commits are milestones, not changes.** Four commits of 631 to 16,341 lines. The *why* lives in ADRs and iteration notes, not in git. See [[Commit Style]].
> 5. **The process mirrors the product.** An append-only record, projections, parameters with floors, roles acting in a capacity, and never blocking on an open question. See [[The Process Mirrors the Product]].

## How to read
Start with [[The Lifecycle as Observed]], then [[Risks and Gaps]], then [[SDLC v2 — Proposed Loop]]. The numbers are in [[Code Measurements 2026-09-25]] and [[Timeline of Milestones]].

## Map
| Folder | Notes |
|---|---|
| `01-context/` | [[Scope, Sources and Method]] · [[The Portal at a Glance]] · [[Timeline of Milestones]] |
| `02-lifecycle/` | [[The Lifecycle as Observed]] · [[Stage 1 — Intent]] · [[Stage 2 — Framing]] · [[Stage 3 — Specification]] · [[Stage 4 — Decision]] · [[Stage 5 — Construction]] · [[Stage 6 — Verification]] · [[Stage 7 — Recording]] · [[Stage 8 — Acceptance and Release]] · [[Stage 9 — Review and Re-vectoring]] |
| `03-collaboration/` | [[Roles and Capacities]] · [[The Dialogue as Interface]] · [[Directive Amplification]] · [[Sub-agents and Harmonisation]] |
| `04-framework/` | [[Three Vaults as Working Memory]] · [[Obsidian Practice]] · [[Sources of Truth]] · [[Traceability]] · [[The Process Mirrors the Product]] |
| `05-code/` | [[Topology as a Development Tool]] · [[One Function per File in Practice]] · [[Code Measurements 2026-09-25]] · [[Event Sourcing and the Demo Seed]] · [[Parameterisation and Profiles]] |
| `06-change/` | [[Commit Style]] · [[Change Size and Shape]] · [[Anatomy of Iteration 04]] · [[Supply Chain in the Loop]] |
| `07-quality/` | [[The Verification Ladder]] · [[Defect Taxonomy]] · [[Privacy and Safety Gates]] · [[Definition of Done (observed)]] |
| `08-operations/` | [[Environments and Surfaces]] · [[Deployment and Release]] |
| `09-assessment/` | [[Strengths]] · [[Risks and Gaps]] · [[Metrics to Watch]] |
| `10-proposals/` | [[SDLC v2 — Proposed Loop]] · [[Commit and Branch Policy]] · [[Automation Backlog]] · [[Checklists]] |
| `99-templates/` | [[Template — Reflection Note]] · [[Template — Iteration Retrospective]] |

## Conventions of this vault
- British English, like `spec/`, `adr/` and `meta/`.
- Wikilinks only within this vault. Notes in other vaults are named by path, for example `meta/iterations/Iteration 04 — Identity, Trust and Settings.md`.
- Every figure comes from a measurement described in [[Scope, Sources and Method]]. Interpretation is marked as such.
- **Versioned, not edited.** v1 is a snapshot. The next reflection goes into `reflections/sdlc/v2/` and says what changed. This follows the portal's own rule: the log is corrected with new events, never rewritten.

> [!question] Open point for the owner
> `LICENSE-DOCS.md` lists `spec/`, `adr/` and `meta/`. `reflections/` is not listed, so under the current rules it falls under Apache 2.0 with the code. Should it join the other vaults under CC BY-NC 4.0?
