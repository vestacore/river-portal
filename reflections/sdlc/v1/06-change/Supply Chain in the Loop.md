---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, change, dependencies]
---

# Supply Chain in the Loop

Back to [[00 SDLC Home]].

## The rule
- Versions two minor lines behind the latest.
- Exact pins.
- Installs only through Socket Firewall (`sfw npm install`).
- No install scripts.
- `npm audit` at zero.

Recorded in `adr/records/ADR-0007` and `meta/process/Dependency Register.md`.

## How it played out
- **The rule met reality at once.** Stepping back two lines landed on releases with critical advisories: every Next.js before 16.3.3, and Tiptap before 3.30.5. **Security advisories override the version rule.** The exceptions are recorded with a reason, and `overrides` pins a transitive package (`uuid`).
- **"Two lines back" has edge cases.**
  - TypeScript 7.0 had only one minor line, so the rule gave 5.9, the mature compiler.
  - postcss publishes few lines, so the rule landed on a release from 2021. It was not installed.
- **Iteration 04 added no external dependency.** Sessions (HMAC with `node:crypto`), the settings registry, validation and the demo sign-in were written in-house, which the topology made cheap. The only lockfile change was three workspace entries (+49 lines).

## In the lifecycle
- **Dependencies are chosen at decision time (stage 4), not during construction.** A new library needs an ADR-level reason. 18 direct packages serve the whole portal.
- **The lockfile is the largest single file** (7,412 lines). It should travel in its own commit, reviewed by tools (`npm audit`, `sfw`) rather than by eye.

## Gaps
- The Docker build installs with `npm ci`, not through `sfw` (TD-09).
- No CI runs `npm audit` on every change.
- Pulumi downloads its provider plugins itself (TD-10).
