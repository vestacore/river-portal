---
type: adr
status: draft
tags: [adr, architecture, frontend, nextjs, open-question]
aliases: [ADR-004]
related: ["[[Frontend Application]]", "[[Technology Stack]]"]
---

# ADR-004 Next.js on Cloud Run

**Status:** Proposed · **Date:** 2026-09-24 · Back to [[Architecture Overview]]

## Context

The public site must be dynamic, positive and animated ([[Design Language]]), fast on low-end Android phones over weak connections ([[Help Seeker Section]]), fully bilingual with localised routes ([[Internationalisation]]), and fed by live projections (counters, ledger, journey timelines) with caching. It also contains app-like flows: multi-step need form with offline outbox, giver account area, carrier leg checklist. The staff app needs a rich interactive UI with realtime data and must run behind IAP ([[ADR-003 IAP for Staff Sections]]). One component library should serve both.

## Decision

Build both `web` and `studio` with **Next.js (App Router, TypeScript, React Server Components)**, packaged as containers and deployed to **Cloud Run**. `web` is fronted by Firebase Hosting / Cloud CDN; `studio` by the IAP load balancer. Public pages use ISR with on-demand revalidation from projectors; personal and staff pages are dynamic and never cached. Styling with Tailwind CSS and design tokens, motion with Framer Motion, i18n with next-intl. Monorepo with pnpm + Turborepo. Details: [[Frontend Application]].

## Consequences

**Positive**
- RSC keeps most rendering on the server, shrinking JS for the help-seeker path.
- ISR + CDN makes public pages cheap and fast while staying truthful to projections.
- One React ecosystem, shared `packages/ui` and `packages/domain` types across web, studio and API.
- Cloud Run gives container portability, IAP compatibility via serverless NEGs and scale-to-zero.

**Negative**
- Next.js release cadence and App Router caching semantics require care; upgrades need regression testing.
- Self-hosting Next.js on Cloud Run means we configure the cache handler (ISR tags shared across instances, e.g. via a Cloud Storage- or Memorystore-backed handler at Tier 3+).
- Cold starts on Cloud Run with min instances 0 (mitigated with min 1 for `web` from Tier 2).
- Heavier than a mostly static site generator for pure content pages.

## Alternatives considered

| Alternative | Why not (for now) |
|---|---|
| **Astro + islands** | Excellent for content pages and tiny JS; weaker for app-like flows (offline form, realtime staff UI); two paradigms across web and studio |
| **Nuxt (Vue)** | Comparable capability; team and ecosystem preference for React; TipTap and Radix fit React better |
| Firebase App Hosting | Simplifies Next.js deploys; IAP integration and fine-grained Cloud Run control less direct; re-evaluate |
| SPA (Vite) + API | Poor SEO and first-load performance on weak devices |

> [!question] #open-question
> Confirm Next.js over Nuxt or Astro + islands for the public site; decide after a spike measuring `/ask` bundle size and LCP on a mid-range Android device over throttled 3G.

## Related
[[Frontend Application]] · [[Technology Stack]] · [[ADR-002 Firebase as Content and Data Platform]] · [[ADR-003 IAP for Staff Sections]] · [[Accessibility]]
