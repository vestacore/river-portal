---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, quality, done]
---

# Definition of Done (observed)

Back to [[00 SDLC Home]].

Put together from what iterations 01–04 actually did before acceptance. **T** means enforced by a tool; **D** means by discipline only.

| # | Criterion | T/D |
|---|---|---|
| 1 | Runs locally with `npm run dev` on demo data, in both languages | D |
| 2 | `npm run check` passes: types, topology, unit tests (including the seed of every profile) | T |
| 3 | The production build passes | D (run locally) |
| 4 | Every role walked in both languages, and the demo walk completes | D |
| 5 | Every route crawled as each role, and the matrix matches the design | D |
| 6 | Screenshots of every profile on desktop and phone, compared side by side | D |
| 7 | Defects found are fixed, or recorded as debt with a trigger | D |
| 8 | Records written: iteration note, observations, registers, ADRs, spec appendices, README and TOPOLOGY | D (TOPOLOGY: T) |
| 9 | No new external dependency without a register entry; `npm audit` at zero | D |
| 10 | The owner accepts by committing | — |

Only criterion 2, and part of criterion 8, is enforced by a tool. The rest rely on the AI's discipline. It has held so far, but it would not survive a change of hands without automation (see [[Automation Backlog]]).
