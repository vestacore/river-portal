---
type: adr
status: accepted
date: 2026-09-24
tags: [adr, code-structure]
spec: none
---

# ADR-0002 Package Topology and Gates

## Context
We want an ordered, explainable code topology in which data-handling concerns are separated and dependencies flow in one direction.

## Decision
- Packages live in **meaning-based groups**: `packages/foundation/*` (identity, privacy, language), `packages/record/*` (the append log and storage), `packages/river/*` (needs, gifts, flows: the write side), `packages/surface/*` (reports, feed, content, pages: what is shown), `packages/assist/*` (AI), `packages/compose/*` (wiring for apps).
- Each package has exactly one entry point, **`gate.ts`**, listing everything it offers. `package.json` `exports` points only at `gate.ts`, so deep imports fail to resolve.
- Access from one package to another is **only through its gate** (`import { submitNeed } from '@river/needs'`).
- Layers may depend only on the same or lower layers: foundation ← record ← river ← surface ← compose ← apps. `assist` sits beside `river` and is used by `surface`.
- The topology is documented in `TOPOLOGY.md` and verified by `tools/check-topology.mjs`, which fails on deep imports, undeclared dependencies, upward dependencies and cycles.

## Consequences
- **Positive**: clear blast radius; packages can move into functions or services later without rewiring.
- **Negative**: a new cross-package capability requires a gate change, which is intentional friction.

## Related
[[ADR-0003 One Public Function per File]]

Back to [[00 ADR Home]].
