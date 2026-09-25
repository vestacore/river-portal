---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, roles]
---

# Roles and Capacities

Back to [[00 SDLC Home]].

The portal records the **capacity** in which a person acts: Helen approves a cost *as Finance Steward*. The process can be read the same way.

| Role | Actor | Acts in | Does not | Evidence |
|---|---|---|---|---|
| Owner | the human product owner | intent, values and constraints; acceptance (commit); release (`pulumi up`); licensing; public positions (the Oleshky disclaimer) | write code; review diffs line by line | 7 directives, 4 commits |
| Engineer | the AI, main thread | framing, specification, decisions, construction, verification, recording | commit, deploy, publish or send anything outside without being asked | 634 tool calls, 23 ADRs, every line of code |
| Authors | AI sub-agents | bounded writing: spec sections, harmonisation, research, bilingual content | touch code or integrate | 11 agents |
| Structural reviewer | `tools/check-topology.mjs` | gates, layers, declarations, one function per file, cycles, `TOPOLOGY.md` up to date | judge meaning | 0 violations at `ddb01cc` |
| Type reviewer | `tsc` | shapes across 17 packages and the app | — | the work list for every refactor |
| Domain reviewer | `node:test` (26 tests) | rules: DP-06, redaction, the seed of each profile, walkability | cover the web app | 13 test files |
| User simulator | the browser pane, driven by the AI | walking every role; crawling the routes | remain after the session | 13 defects found in iteration 04 |
| Recorder | `tools/design-shot.mjs` | screenshots with device emulation, also signed in as a demo person | — | README and evaluation images |

## Separation of duties
- **The author and the approver are different people.** The AI writes and the owner commits.
- **So are the preparer and the releaser.** The AI prepares the release and the owner deploys it.
- **Nobody reviews the author's work independently.** The portal has an *auditor* role that sees everything and changes nothing; the process has no such role. See [[Risks and Gaps]].

## Roles the process still lacks
- An **independent reviewer**: a person, or an AI with a fresh context and a review-only brief.
- **Real users**: recipients, givers, carriers or coordinators trying the portal. The personas stand in for them.
- A **security and privacy review** before real data.
- **Operations**: nobody watches the deployed service.
