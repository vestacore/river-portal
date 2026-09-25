---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, quality, privacy, safety]
---

# Privacy and Safety Gates

Back to [[00 SDLC Home]].

## Built into the code
- **Private by default.** Personal details live in `private` documents, never in events or on public pages. The seed test fails if a name, phone number, e-mail or village appears in a public document.
- **Redaction** of free text before it leaves `private`. It matches name stems, because Ukrainian names inflect. Since iteration 04 the stems are bounded, so ordinary words survive.
- **A safety delay** before a public report: a floor of 14 days in the registry, 21 days in the state programme.
- **Oblast-level places** in public. Thanks shared with participants are stored without names.
- **Safety for people asking for help:** a quick exit, an emergency notice, referrals.
- **Demo guards.** There is no demo sign-in on the public surface, and demo sign-in with Firestore needs an explicit sandbox flag.

## Hard gates before real personal data
| Gate | Debt | Why it blocks |
|---|---|---|
| Per-person encryption and crypto-shredding | TD-01 | Erasure must be possible without editing the log |
| Delayed public aggregates (72 hours) and k-anonymity (a minimum group of 5) | TD-08 | Live counters can locate a recent delivery, especially for an organisation that serves one oblast |
| Real sign-in for recipients, givers and carriers | TD-15 | "My river" works only for the demo people |

## In the lifecycle
There is **no go-live stage** yet. Nothing in the process stops a deployment with `seed: none` and real traffic while the hard gates are open. The gates live only in a register and in the README.

## Proposal
Make a **go-live checklist** the final stage of a release. Each hard gate is an item that must be ticked with evidence: a test, an ADR or a review. Until then, the public stack keeps its demo data. See [[Checklists]].
