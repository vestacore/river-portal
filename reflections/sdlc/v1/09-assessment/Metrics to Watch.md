---
type: assessment
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, assessment, metrics]
---

# Metrics to Watch

Back to [[00 SDLC Home]].

Proposed metrics, each with its value today (the v1 baseline), so that v2 can compare.

| Metric | Baseline (v1) | Why it matters |
|---|---|---|
| AI work window per iteration | 25–75 min | Speed of construction |
| Acceptance latency (end of work → commit) | 53 min to 2 h 29 min | The real bottleneck |
| Directive length → files changed | 472 characters → 263 files (iteration 04) | Amplification, and so the cost of review |
| Files and lines per commit | 15–379 files; +631 to +16,341 lines | Reviewability |
| Defects found per rung | Rungs 6–8: 13; rungs 1–5 before them: 0 | Where verification pays off |
| Tests against library code | 26 tests; 418 test lines for 4,182 library lines | Protection against regressions |
| Web app tests | 0 | Gap R5 |
| Topology violations at acceptance | 0 | Structural health |
| ADRs per iteration | 17 · 1 · 1 · 4 | Rate of decisions |
| Documentation against code change | about 14% of lines (iteration 04) | Discipline of recording |
| Open hard gates | 3 (TD-01, TD-08, TD-15) | Readiness for real data |
| Open debts / assumptions / questions | 22 / 16 / 30 | Decisions deferred |
| Context compactions per iteration | 1 (iteration 04) | Size of an iteration against the context window |
| New external dependencies per iteration | 0 (iteration 04) | Exposure of the supply chain |

A future `tools/sdlc-metrics.mjs` could compute most of these from git, the vaults and the transcript.
