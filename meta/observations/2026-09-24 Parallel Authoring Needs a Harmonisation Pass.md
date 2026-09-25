---
type: observation
date: 2026-09-24
tags: [observation, process]
---

# Parallel Authoring Needs a Harmonisation Pass

Back to [[00 Meta Home]].

**What happened.** Eight authors wrote the spec sections in parallel from a shared brief. Links were consistent, because the Vault Map fixed every filename. But *numbers and event names* drifted: k-anonymity of 3 vs 5, safety delays of 24 h, 72 h, 7 d and 14 d, and about 130 variant event names.

**What worked.** A shared brief with fixed statuses, visibility levels and decision point IDs. Every author reported the new names they invented.

**What we changed.** We introduced `spec/00-meta/Canonical Parameters.md` as the single source for thresholds and naming, and ran a dedicated harmonisation pass.

**Lesson for code.** The same risk exists across packages. Hence gates, typed event unions in `@river/log` and the topology checker.
