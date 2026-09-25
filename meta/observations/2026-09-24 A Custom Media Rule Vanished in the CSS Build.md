---
type: observation
date: 2026-09-24
tags: [observation, css, tooling]
---

# A Custom Media Rule Vanished in the CSS Build

Back to [[00 Meta Home]].

**What happened.** A hand-written `@media (max-width: 639px) { .rd-label { display: none } }` appended to `globals.css` never reached the served CSS, while other custom rules in the same file did. Earlier, a block inside `@layer components` was emitted unlayered. The root cause (Tailwind 4 / Lightning CSS processing in Turbopack development) was not isolated.

**What we changed.** Responsive behaviour uses Tailwind variants on the elements themselves (`max-sm:hidden`). Custom primitives in plain CSS avoid properties that utilities need to override (for example, the rich-text base rule no longer sets a colour).

**Follow-up.** TD-13 in the [[Technical Debt Register]]: reproduce in a minimal project and report upstream if it is a bug.
