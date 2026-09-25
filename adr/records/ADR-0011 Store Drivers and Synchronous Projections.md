---
type: adr
status: accepted-provisional
date: 2026-09-24
tags: [adr, data]
spec: spec/08-architecture/Event Log and Projections.md
---

# ADR-0011 Store Drivers and Synchronous Projections

## Context
The spec prescribes an append-only log in Firestore with projections built by Cloud Functions on event creation. For the first iterations we want visible UI fast and local development without emulators, while keeping the event-sourced model intact.

## Decision
- A **DocStore** interface (`@river/store`) with two drivers:
  - `memory`: local development and demo, seeded from demo events at start-up.
  - `firestore`: via `firebase-admin`, server-side only.
- **Commit** (`@river/log`): a command produces event drafts. `commit` appends the events *and* runs registered **projector functions** in the same transaction, writing the read documents.
- Projectors are pure functions `(event, read) → writes`. They are the same functions a Cloud Function will run later, when we move to asynchronous projection for scale (Tier 3+). Replay over the log rebuilds every document.
- All Firestore access is server-side. Security rules deny all client reads and writes for now.

## Consequences
- **Positive**: read-your-writes consistency in the UI; no function deployment needed for the first iterations; a straightforward path to asynchronous projectors.
- **Negative**: transaction size grows with the number of projections per event (the limit is 500 writes per transaction; far below it for now).
- **Provisional**: per-person encryption of personal free text (crypto-shredding in the spec) is **not yet implemented**. Personal data is kept in separate `private` documents so the change stays local. Tracked in `meta/`.

## Implementation notes (2026-09-24)
- Demo data is seeded **through the same commands** as the UI, in the past (`ctx.at`), so every projector is exercised. A `create`-only marker document (`orgs/{org}/meta/seed`) makes seeding happen once, even with several instances.
- Only Firestore is used so far. Firebase Authentication (for givers and returning recipients) and a Firebase project resource come with the iteration that adds accounts.
- Firestore rules deny all client access; the rules are deployed by Pulumi (`firebaserules` Ruleset + Release).

Back to [[00 ADR Home]].
