---
type: adr
status: accepted
date: 2026-09-24
tags: [adr, tooling]
spec: none
---

# ADR-0015 TypeScript Without a Build Step for Packages

## Context
We want fast feedback and few tools.

## Decision
- **TypeScript 5.9** (two lines behind 7.0), `strict`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `allowImportingTsExtensions`, `noEmit`.
- Imports use explicit `.ts` extensions. Packages are consumed as source: Next.js compiles them (`transpilePackages`), and tests run on **Node 22's built-in type stripping** with `node --test`. No Vitest or Jest.
- Only erasable syntax: no `enum` or `namespace`, and no parameter properties. Status sets are string unions with `as const` arrays.

## Consequences
- **Positive**: no per-package build; zero test-framework dependencies.
- **Negative**: Node type stripping does not type-check, so `tsc --noEmit` runs separately (`npm run typecheck`).

Back to [[00 ADR Home]].
