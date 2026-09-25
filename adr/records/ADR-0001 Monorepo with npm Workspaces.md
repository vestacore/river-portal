---
type: adr
status: accepted
date: 2026-09-24
tags: [adr, repository]
spec: none
---

# ADR-0001 Monorepo with npm Workspaces

## Context
The portal consists of a web application, many small domain packages, infrastructure code and tooling. `pnpm` is not installed on the development machine, and every extra tool is another supply-chain surface ([[ADR-0007 Dependency Supply-Chain Policy]]).

## Decision
One repository with **npm workspaces** (npm 10, Node 22 LTS). Workspaces: `apps/*`, `packages/*/*`, `infra`. One root `package-lock.json`. Package names use the `@river/` scope and are private.

## Consequences
- **Positive**: no extra package manager; one lockfile to review; `sfw npm install` covers everything.
- **Negative**: npm hoisting is less strict than pnpm; phantom dependencies are possible. Mitigated by the topology checker (`tools/check-topology.mjs`), which verifies that every cross-package import is declared.

## Alternatives considered
| Option | Why not (now) |
|---|---|
| pnpm + Turborepo | Extra tools and install surface; build caching not needed yet |
| Separate repositories | Slows the "visible on UI as soon as possible" loop |

Back to [[00 ADR Home]].
