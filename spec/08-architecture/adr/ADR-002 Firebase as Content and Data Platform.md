---
type: adr
status: draft
tags: [adr, architecture, firebase, firestore]
aliases: [ADR-002]
related: ["[[Firebase Data Model]]", "[[Technology Stack]]"]
---

# ADR-002 Firebase as Content and Data Platform

**Status:** Accepted · **Date:** 2026-09-24 · Back to [[Architecture Overview]]

## Context

The portal must be affordable for a few volunteers at [[Scaling Tiers#Tier 1 — Spring|Tier 1]] and robust for a humanitarian programme at [[Scaling Tiers#Tier 4 — Basin|Tier 4]]. It needs: an append-only log with transactional writes ([[ADR-001 Event-Sourced Append Log]]), realtime updates for coordinators, file storage for photos and receipts, low-friction authentication for the public (email link, phone OTP), and structured content with live data. The organisation's staff already use Google Workspace, and the team prefers one cloud and one language.

## Decision

Use **Firebase on Google Cloud** as the data and content platform:
- **Cloud Firestore** (Native mode, EU multi-region) for the event log, aggregate heads, projections and content documents.
- **Cloud Storage for Firebase** for media, with Storage rules and a processing pipeline.
- **Firebase Authentication** for public users ([[Identity and Access]]).
- **Cloud Functions (2nd gen)** for projectors, media processing and notification routing.
- Content is stored as structured block JSON in Firestore, not in a third-party headless CMS ([[Content Management]]).

## Consequences

**Positive**
- Serverless, scale-to-zero; very low fixed cost for small organisations.
- Realtime listeners power the [[Coordinator Workspace]] without extra infrastructure.
- Emulator Suite enables fast local development and rules testing.
- Security rules add a second line of defence behind `river-api` ([[Security Rules]]).
- Content, data and media under one IAM model, one backup regime, one region policy.

**Negative**
- Limited querying (no joins, composite indexes needed); analytics require BigQuery at Tier 3+.
- Per-document write-rate limits require careful aggregate design and sharded counters ([[Scaling Architecture]]).
- Rules cannot redact fields; projections must split documents by visibility level.
- Vendor lock-in to Google Cloud; mitigated by domain logic in plain TypeScript (`packages/domain`) and daily log exports.

## Alternatives considered

| Alternative | Why not |
|---|---|
| Cloud SQL (Postgres) + Prisma | Strong querying, but always-on cost (~£25+/month minimum), no built-in realtime |
| Supabase | Good fit technically; separate vendor from Workspace/IAP, residency and DPA overhead |
| Headless CMS (Sanity, Contentful) for content | Content would live apart from the log; live data blocks and consent checks harder; per-seat cost |
| AlloyDB / Spanner | Overkill and expensive for Tier 1–3 |

## Related
[[Firebase Data Model]] · [[Technology Stack]] · [[ADR-004 Next.js on Cloud Run]] · [[Deployment and Environments]]
