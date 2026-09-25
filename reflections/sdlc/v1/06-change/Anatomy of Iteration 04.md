---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, change, iteration-04]
---

# Anatomy of Iteration 04

Back to [[00 SDLC Home]]. Sources: `meta/iterations/Iteration 04 — Identity, Trust and Settings.md` and the session transcript (times of the first matching tool call, EEST).

## The directive
M6, 472 characters, 25 Sep 13:26:
- V1 (identity), V4 (trust) and quick steps of V5 (safety);
- blocks configurable only in the admin part;
- the whole system parameterised through a settings registry, in three profiles;
- "that is how we will test and evaluate from now on".

## The run
| From | Activity |
|---|---|
| 13:33 | Packages: settings registry, identity, config |
| 13:34 | Content agent starts, with the types fixed in its brief |
| 13:39 | Domain generalisation: reporting currency, costs, carriers |
| 13:51 | **Context compaction.** Work resumes from the summary and the files |
| 13:59 | Web app: layout, header and home by settings; demo sign-in, "My river", studio actions and settings form, finished around 14:10 |
| 14:03 | First test run after the compaction; 14:10 first topology run |
| 14:11 | First dev-server start and first screenshots |
| 14:14 | Walk through every role, with fixes: redaction at 14:14, walk steps from 14:16 |
| 14:31 | Route crawl as each role |
| 14:37 | Production build; screenshots from the public surfaces of each profile |
| 14:41 | ADRs; 14:43 iteration note and observation; 14:47 README |
| 14:48 | Last action |
| 17:17 | The owner commits `ddb01cc` |

## Numbers
- 320 tool calls in 75 minutes: 213 shell calls, 55 browser batches, 16 file reads.
- 263 files changed (+6,193 −870); 3 new packages; 1 new layer group (`steward`).
- 26 tests at the end, 11 more than after iteration 01.
- 13 defects found by walk, crawl and screenshots, all fixed before the commit.
- 4 ADRs and 2 amendments; 1 iteration note, 1 observation, 8 new debts, 5 new assumptions, 2 open questions.

## What went well
- Building bottom-up kept the type checker useful at every step.
- The registry turned one code base into three organisations within one iteration.
- The walk made the demo *usable*, not just compilable.

## What did not
- **Settings semantics were designed wrongly.** Saving a group made everything custom. This was a domain flaw, found only through the UI.
- **The seed did not support the walk** it was meant to demonstrate.
- **The iteration was too large to review.** It is the clearest case for slicing (see [[Commit and Branch Policy]]).
