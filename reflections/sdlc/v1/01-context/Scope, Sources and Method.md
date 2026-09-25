---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, method]
---

# Scope, Sources and Method

Back to [[00 SDLC Home]].

## Scope
The software development lifecycle of River Portal, from the owner's first directive (24 September 2026, 15:38) to commit `ddb01cc` (25 September 2026, 17:17). All times are EEST (UTC+3), as in the git history. That covers:
- iterations 00–04;
- the site map and domain review;
- a code base of 17 packages, a Next.js app, a Pulumi program and two tools.

## Sources
| Source | What was taken from it | How |
|---|---|---|
| Git history | Four commits: time, message, files, and lines added and removed per area | `git log`, `git show --numstat` |
| Source tree at `ddb01cc` | Files, lines, tests, exported values, type files and data files per package | A script over `git ls-files` |
| The dialogue | Seven directives from the owner : time, length, content; the AI's activity after each | The session transcript: 634 tool calls in the main thread, 11 sub-agents, one context compaction |
| `spec/`, `adr/`, `meta/` | Notes, words and wikilinks per vault; iteration logs, observations, registers | `find`, `wc`, `grep` |
| Tools | The rules `tools/check-topology.mjs` enforces; what `tools/design-shot.mjs` captures | Reading the code |

## Method
1. Measure first, then interpret. Every number in this vault comes from one of the sources above.
2. An AI **work window** runs from the first to the last tool call of the main thread after a directive. It is wall-clock time, not effort. Sub-agents worked in parallel within the windows.
3. Interpretations are marked as such ("reads as", "suggests") and are open to challenge.

## Limits
- **One project, 26 hours.** The patterns may not hold at a larger scale or with more people.
- **Self-assessment.** An AI describing its own process will tend to flatter it. The counterweights are the numbers, and the defect lists the process itself produced (see [[Defect Taxonomy]]).
- **Not observed:**
  - the owner's time outside the dialogue (reading, reviewing, deploying);
  - the transcripts of the sub-agents;
  - the state of the cloud deployment.
