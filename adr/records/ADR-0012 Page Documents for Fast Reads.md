---
type: adr
status: accepted
date: 2026-09-24
tags: [adr, data, performance]
spec: spec/02-entities/system/Projection.md
---

# ADR-0012 Page Documents for Fast Reads

## Context
Pages must reach the UI quickly. Firestore charges per document read, and latency grows with query fan-out.

## Decision
- Every public page is rendered from **one or two pre-shaped documents** (page documents) kept up to date by projectors:
  - `public/{org}`: home. Holds counters, active campaigns (summary), the latest 12 feed items, site content blocks and locales.
  - `public/{org}/campaigns/{slug}`: campaign page with progress and cost breakdown.
  - `public/{org}/reports/{id}`: published report.
  - `public/{org}/feed/{id}`: feed items, paginated by `publishedAt`.
- Public documents contain only `public`-level data ([[ADR-0011 Store Drivers and Synchronous Projections]]). Redaction happens in the projector, never in the page.
- Next.js caches public pages with time-based revalidation (30 s) plus on-demand revalidation on the same instance. Cross-instance freshness is bounded by the revalidation window.

## Consequences
- **Positive**: home renders with a single document read; predictable cost; the privacy boundary is structural.
- **Negative**: denormalisation. Accepted, because projections are rebuildable.

Back to [[00 ADR Home]].
