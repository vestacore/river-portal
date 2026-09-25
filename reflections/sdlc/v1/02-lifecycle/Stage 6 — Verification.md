---
type: stage
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, stage, verification]
---

# Stage 6 — Verification

Up: [[The Lifecycle as Observed]] · Previous: [[Stage 5 — Construction]] · Next: [[Stage 7 — Recording]]

## Purpose
Find out whether what was built works for every person, in every language and in every profile, before the owner looks.

## What happens
Checks run in a fixed order, from the cheapest to the most realistic:
1. types;
2. topology;
3. unit tests;
4. the demo seed of every profile;
5. the production build;
6. a walk through every role in both languages;
7. a crawl of every route as each role;
8. screenshots of every profile on desktop and phone, compared side by side.

The ladder, and what each rung finds, is in [[The Verification Ladder]].

## Evidence
- **Iteration 04.** Rungs 1–5 were green; rungs 6–8 then found **13 defects**, all fixed before acceptance. See `meta/observations/2026-09-25 Walking Every Role Found What Tests Missed.md`.
- **Iteration 01.** Running the UI found Tailwind layer, CSP and inflection issues that no check had caught.
- **Iteration 02.** The design loop *was* verification: five rounds of screenshots, each critiqued and scored.

## Weak spots
- **The upper rungs are driven by the AI but not automated.** They catch a defect once but protect nothing afterwards: there is no regression suite for the walk, the crawl or the screenshots.
- **The AI verifies its own work.** Nobody independent tries to break it.

## Proposal
- Automate rungs 6–8 (walk, crawl, screenshot matrix) as repeatable scripts in CI.
- Add an independent review by a fresh-context agent that acts as auditor.

See [[Automation Backlog]].
