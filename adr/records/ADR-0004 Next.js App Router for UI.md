---
type: adr
status: accepted
date: 2026-09-24
tags: [adr, ui]
spec: spec/08-architecture/adr/ADR-004 Next.js on Cloud Run.md
---

# ADR-0004 Next.js App Router for UI

## Context
The spec proposes Next.js on Cloud Run and leaves Nuxt and Astro open (spec ADR-004). The portal needs fast server-rendered public pages, simple forms that work on weak phones, and a rich editing surface for staff.

## Decision
**Next.js 16.1 (App Router) with React 19.1**, TypeScript. Server Components render public pages from pre-shaped documents ([[ADR-0012 Page Documents for Fast Reads]]); forms use Server Actions, so they work without client JavaScript. Client components are used only for the in-place editor and small interactions. Output mode `standalone` for Cloud Run.

## Consequences
- **Positive**: one framework for public site and studio; progressive enhancement for the help-seeker flow; strong ecosystem for Tiptap.
- **Negative**: framework churn (for example `middleware.ts` became `proxy.ts` in 16). Pinned two minor lines behind latest to let such changes settle.
- **Follow-up**: measure the `/ask` bundle on a mid-range Android phone. This is the test the spec asks for.

## Alternatives considered
| Option | Why not (now) |
|---|---|
| Astro + React islands | Excellent for static pages, but the studio and in-place editing would need a second model |
| Nuxt (Vue) | Viable; the Tiptap and React ecosystem is stronger for our editor needs |
| Remix / React Router 7 | Smaller ecosystem for image optimisation and ISR on Cloud Run |

## Amendment 2026-09-24
The installed version is **16.3.5**, not 16.1: advisories made the 16.1 and 16.2 lines unsafe (see ADR-0007 amendment). App Router notes: `proxy.ts` replaces `middleware.ts`; `params` and `searchParams` are promises.

Back to [[00 ADR Home]].
