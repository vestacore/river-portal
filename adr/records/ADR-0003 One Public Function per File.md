---
type: adr
status: accepted
date: 2026-09-24
tags: [adr, code-structure]
spec: none
---

# ADR-0003 One Public Function per File

## Context
Functions that other code reuses should be easy to find, review, test and move.

## Decision
- A file exports **at most one public function**, named like the file (`submitNeed.ts` → `submitNeed`). Private helpers stay unexported in the same file, or live in their own file if another file reuses them.
- **Data structures** (types, status unions, constants describing data) live in their own files under `types/` in each package, e.g. `types/Need.ts`.
- Code is written as functions. Classes are used only where a library requires them.
- The gate re-exports functions and types; nothing else is public.

## Consequences
- **Positive**: small reviewable diffs; the gate reads like a table of contents.
- **Negative**: more files. Accepted.

Back to [[00 ADR Home]].
