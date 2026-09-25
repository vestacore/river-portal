---
type: adr
status: accepted
date: 2026-09-24
tags: [adr, security]
spec: none
---

# ADR-0007 Dependency Supply-Chain Policy

## Context
Supply-chain attacks through npm (typosquatting, hijacked maintainers, malicious install scripts, freshly published compromised versions) are a primary risk.

## Decision
1. **Version choice: two minor lines behind the latest.** `tools/pick-version.mjs` takes the latest stable `major.minor`, steps back two lines in release order (crossing a major boundary if the latest major has fewer lines), and uses the highest patch of that line. Exceptions are recorded in the `meta/` Dependency Register:
   - `@types/node` follows the runtime major (Node 22).
   - Transitive-only tools such as `postcss` are not installed directly.
   - If a known advisory affects the chosen line, we go forward to the nearest safe patch.
2. **Installs only through Socket Firewall**: `sfw npm install …` (and `sfw npm ci` in CI).
3. **Exact pins** (`save-exact=true`); the lockfile is committed and reviewed.
4. **No install scripts**: `ignore-scripts=true` in `.npmrc`. Packages that need a native binary must ship it through optional dependencies.
5. **Minimal set**: prefer the platform (Node built-ins, Web APIs) and our own small functions to adding a package. Every new direct dependency is registered in the meta vault with its reason.
6. `npm audit` after every change to dependencies.

## Consequences
- **Positive**: an attacker's window on fresh releases is usually closed before we adopt them; no code runs at install time.
- **Negative**: we lag new features; security patches must be tracked. We watch advisories and take patch releases of the chosen line.

## Amendment 2026-09-24: the audit comes first
Applying the rule mechanically picked Next.js 16.1.7 and Tiptap 3.29.2, which carry known critical or high advisories. The procedure is now:
1. Pick the version two lines back with `tools/pick-version.mjs`.
2. Install with `sfw npm install` and run `npm audit`.
3. If the chosen line is affected, move **forward** to the nearest patch that fixes every advisory **and is at least 7 days old** (cool-off). Record it as an exception.
4. For transitive advisories, prefer upgrading the direct dependency. If that breaks the cool-off, pin the transitive package with `overrides`.
Result on 2026-09-24: `next` 16.3.5, `@tiptap/*` 3.30.6, `uuid` override 11.1.1, and 0 vulnerabilities. Details are in the meta Dependency Register.

Back to [[00 ADR Home]].
