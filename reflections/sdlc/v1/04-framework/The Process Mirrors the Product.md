---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, framework, isomorphism]
---

# The Process Mirrors the Product

Back to [[00 SDLC Home]].

The ideas that shape the portal also shape how it is built. This is an interpretation, but a useful one: one mental model serves both levels.

| In the product | In the process |
|---|---|
| **The river remembers:** an append-only log where a correction is a new event, never an edit | ADRs are amended with dated notes, not rewritten. Observations are never deleted. The spec grows by dated appendices. This reflection is versioned (v1, v2, …) instead of edited |
| **Projections:** public pages derived from the log, never written by hand | `TOPOLOGY.md` is generated from the code. The README and iteration summaries are projections of the vaults, but kept by hand, so they drift |
| **Canonical parameters with floors** that no administrator can loosen | Working agreements (supply chain, deployment by the owner, topology) that no iteration may loosen. The topology checker is a floor for structure |
| **Roles acting in a capacity**, recorded with every action | The owner acts as approver and releaser, the AI as engineer, agents as authors, tools as reviewers |
| **Separation of duties:** nobody approves their own cost | The AI writes; the owner commits and deploys |
| **The left bank is always open:** nobody is turned away for lack of proof | No work waits on an open question; the nearest variant is taken and recorded |
| **Consent is specific and revocable** | The AI asks before any outward-facing act: publishing, deploying, committing |
| **A safety delay** before a public report | A pause for acceptance before a commit; hard gates before real personal data |
| **The gratitude loop:** thanks travel back to those who helped | Observations travel back into the agreements, as "what we changed" |
| **An auditor** who sees everything and changes nothing | *Missing from the process.* See [[Risks and Gaps]] |

## Where the analogy breaks
- **Git is not the log.** A commit squashes hundreds of changes into one event, and the reasons are not in it.
- **Hand-kept projections drift.** The portal's projectors run in the same transaction as the event; the README does not.

[[SDLC v2 — Proposed Loop]] proposes a fix for each: finer commits that carry references, and more generated projections.
