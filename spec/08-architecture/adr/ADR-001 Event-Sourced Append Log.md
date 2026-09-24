---
type: adr
status: draft
tags: [adr, architecture, event-sourcing]
aliases: [ADR-001]
related: ["[[Event Log and Projections]]", "[[Log Event]]", "[[Projection]]"]
---

# ADR-001 Event-Sourced Append Log

**Status:** Accepted · **Date:** 2026-09-24 · Back to [[Architecture Overview]]

## Context

River Portal must show honest numbers ([[Guiding Principles#P8. Honest numbers, beautifully shown]]), give auditors and trustees a trustworthy trail ([[Accountability and Audit]]), trace each gift from source to mouth ([[Journey Story]]), explain every [[Reputation]] signal to its subject, and let corrections happen without rewriting history ([[Guiding Principles#P7. The river remembers]]). Many coordinators may act on the same [[Flow]]. Public pages, donor reports and dashboards all need different shapes of the same facts, with different [[Visibility Levels]].

A conventional CRUD model would store current state only; history would depend on audit tables that are easy to bypass, and public figures would be computed ad hoc.

## Decision

All domain state changes are recorded as immutable, append-only **[[Log Event]]s** in `orgs/{orgId}/events`. Clients send **commands** to `river-api`, which validates, authorises and appends events in a Firestore transaction with per-aggregate optimistic concurrency. All read models are **[[Projection]]s** built by Cloud Functions and are rebuildable by replay. Personal data is kept out of event payloads (ids only, personal free text encrypted with per-person keys) so that erasure is achieved by **crypto-shredding**.

Details: [[Event Log and Projections]], [[Event Catalogue]].

## Consequences

**Positive**
- Complete, tamper-evident audit trail by construction; decisions carry `dp` metadata.
- Public numbers and reports are derivations, never hand-typed ([[Transparency Ledger]]).
- New views (a new report, a partner dashboard) can be added later and back-filled by replay.
- Explainable reputation: each signal lists the events behind it ([[Reputation Signals]]).
- Natural fit for offline clients (commands with idempotency keys).

**Negative**
- Eventual consistency between write and read (target p95 < 5 s); UI must handle "pending" states.
- More concepts for developers (commands, events, projectors, upcasters).
- Schema evolution needs discipline: events are never rewritten, only upcast.
- Erasure requires crypto-shredding and careful payload design; a mistake that puts plaintext PII into a payload is costly to remediate.
- Firestore is not a purpose-built event store; ordering and replay rely on our own `seq` and indexes.

## Alternatives considered

| Alternative | Why not |
|---|---|
| CRUD documents + audit-log table | History is optional and bypassable; public figures drift from records |
| CRUD + change-data-capture to BigQuery | Captures *what changed*, not *why* (intent, decision point) |
| Dedicated event store (EventStoreDB, Kafka) | Extra infrastructure and cost unsuitable for Tier 1 charities |
| Postgres append table + outbox | Viable; rejected with [[ADR-002 Firebase as Content and Data Platform]] for cost and realtime reasons |

## Related
[[ADR-002 Firebase as Content and Data Platform]] · [[ADR-006 Private by Default Visibility]] · [[Firebase Data Model]] · [[Security Rules]] · [[Data Retention]]
