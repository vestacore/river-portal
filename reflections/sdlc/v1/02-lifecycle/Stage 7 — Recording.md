---
type: stage
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, stage, recording]
---

# Stage 7 — Recording

Up: [[The Lifecycle as Observed]] · Previous: [[Stage 6 — Verification]] · Next: [[Stage 8 — Acceptance and Release]]

## Purpose
Leave a record that lets the next session, human or AI, start from the same ground.

## What happens
| Record | When | Where |
|---|---|---|
| Iteration note: goal, what was built, log, evaluation, next | end of the iteration | `meta/iterations/` |
| Observation: what happened, why it matters, what we changed | when something surprising happens | `meta/observations/` |
| Registers: dependencies, technical debt with triggers, nearest-variant assumptions, working agreements | whenever the fact changes | `meta/process/` |
| Decisions | during or after construction | `adr/records/` and the ADR home |
| Spec appendices and open questions | when the product changes or a question appears | `spec/` |
| Projections: README with fresh screenshots; `TOPOLOGY.md` (generated) | end of the iteration | repository root |

## Evidence
- **Volume.** In iteration 04, about 760 lines of records came with about 5,400 lines of code change (14%).
- **The records made the context compaction survivable.** After the conversation was summarised at 13:51, work continued from the summary and the files, not from memory. The vaults are the durable memory; the chat is volatile.
- **A private layer.** The AI also keeps a memory outside the repository: two notes, on the spec vault's conventions and on the engineering rules.

## Weak spots
- **The actor writes the record.** The iteration note, the evaluation and the defect list are written by whoever did the work. In practice they are candid, but nobody checks them.
- **Hand-kept projections drift.** The README's counts of notes, words and events, and the registers, are updated by hand. `TOPOLOGY.md` is generated and never drifts.
- **Status fields lag.** Iterations 01 and 03 still say `status: review`, although both were accepted.

## Proposal
- Generate whatever can be generated: vault statistics, the ADR index, the numbers in the README.
- Update statuses as part of acceptance.
- Have someone else sign off the evaluation section: the owner, or a fresh-context agent.
