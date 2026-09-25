---
type: observation
date: 2026-09-24
tags: [observation, dependencies]
---

# Supply-Chain Rule Meets Real Version Lines

Back to [[00 Meta Home]].

Applying "two minor versions behind latest" mechanically produced edge cases:

- **TypeScript**: latest is 7.0 (the new native compiler), with only one minor line. Stepping back two *lines in release order* gives 5.9.3, the mature JavaScript-based compiler, which is what we want.
- **postcss**: the rule landed on a 2021 release, because postcss publishes few minor lines. Not installed directly; Tailwind brings its own.
- **@types/node**: must follow the runtime major (Node 22), not the latest.

The rule was refined into `tools/pick-version.mjs` and ADR-0007. Exceptions are listed in the [[Dependency Register]].
