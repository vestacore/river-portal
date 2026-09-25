---
type: stage
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, stage, construction]
---

# Stage 5 — Construction

Up: [[The Lifecycle as Observed]] · Previous: [[Stage 4 — Decision]] · Next: [[Stage 6 — Verification]]

## Purpose
Write the code, the infrastructure and the content that the decisions call for.

## What happens
- **Bottom-up by layer.** The topology gives the building order (see [[Topology as a Development Tool]]). In iteration 04:
  1. foundation (settings, identity);
  2. steward (config);
  3. record (the settings passed into every command);
  4. river (currency, costs, carriers);
  5. surface (tokens, page texts, report facts);
  6. compose (personas, seed);
  7. the web app (library, public pages, studio);
  8. infra (one config key).
- **Type errors as the work list.** After a change at a lower layer, `tsc` lists every dependant that has to follow. The rename `gbpMinor` → `reportingMinor` was finished by emptying that list.
- **Scripted, guarded edits.** Almost every change in the main thread was a small script of text replacements. Each replacement asserted that its target occurs exactly once, and the script stopped otherwise. The interactive file-edit tool was used **0 times** in 634 tool calls; the rest were whole-file writes. Wide changes are fast this way, and they fail loudly when the code is not as expected.
- **Content in parallel.** A sub-agent wrote 1,029 lines of bilingual content (profile texts, page texts, demo variants) while the main thread wrote code. The two met at type definitions agreed in advance.
- **Small units.** 150 function files with a median of 10 lines (see [[One Function per File in Practice]]).

## Evidence
- Iteration 04 made 320 tool calls in 75 minutes: 213 shell calls (mostly scripts and checks), 55 batches of browser actions and 16 file reads.
- The topology checker failed once in iteration 04: the web app used three internal packages it had not declared. The fix was immediate.

## Weak spots
- **Scripted edits leave no per-edit diff** for anyone to read, and the owner reviews none of them. Correctness rests on the checks that follow (see [[The Verification Ladder]]).
- **The web app has no unit tests** (110 files, 5,133 lines). Its role checks were verified only by crawling the routes.

## Proposal
- Commit each layer as construction proceeds, so that each slice can be read on its own (see [[Commit and Branch Policy]]).
- Turn the route crawl into a test (see [[Automation Backlog]]).
