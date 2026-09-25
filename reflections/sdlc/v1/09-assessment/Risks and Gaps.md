---
type: assessment
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, assessment, risks]
---

# Risks and Gaps

Back to [[00 SDLC Home]].

| # | Risk | Evidence | Impact | Proposed mitigation |
|---|---|---|---|---|
| R1 | **No independent review.** The AI writes, verifies and records its own work | Every ADR, test and evaluation has one author | Blind spots repeat; records turn optimistic | A fresh-context review agent acting as auditor; the owner signs off evaluations |
| R2 | **Coarse commits** | 4 commits, up to 379 files each | No bisect, revert or blame; review by evidence only | A branch per iteration, commits by layer, `Refs:` trailers ([[Commit and Branch Policy]]) |
| R3 | **No CI** | Checks run only in the AI's session | A change that fails the checks can still be committed | CI running `npm run check`, the build and the audit |
| R4 | **The upper rungs cannot be repeated** | Walk, crawl and screenshots driven by the AI by hand | Regressions return unnoticed | A Playwright walk, a crawl test, a screenshot matrix ([[Automation Backlog]]) |
| R5 | **The web app has no unit tests** | 110 files, 5,133 lines, 0 tests | Role checks, forms and actions go untested between walks | Tests for `actingAs`, `requireStage` and the role matrix |
| R6 | **Specified and built are hard to tell apart** | The spec describes many routes that do not exist | Readers mistake intent for reality | A `build:` field and a generated coverage table |
| R7 | **Plans live in volatile context** | One compaction in iteration 04 | Intent lost at compaction | Write the iteration note skeleton first |
| R8 | **Releases are invisible** | No release notes; the cloud state is unknown | Code and service drift apart | A release log and smoke checks |
| R9 | **Hard gates have no go-live stage** | TD-01, TD-08 and TD-15 are open | Real data could arrive too early | A go-live checklist |
| R10 | **Hand-kept projections drift** | README counts, note statuses | Misleading documentation | Generate them, and check the vaults |
| R11 | **Demo data can mislead** | A 73% cost share; no simulated scale | Wrong conclusions from evaluation | Credibility assertions; a volume seed |
| R12 | **This vault's licence is undecided** | `reflections/` is not in `LICENSE-DOCS.md` | Unclear terms of reuse | The owner decides |
