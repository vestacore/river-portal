---
type: moc
status: draft
tags: [architecture, moc]
aliases: [Section 08, System Architecture]
related: ["[[Technology Stack]]", "[[Event Log and Projections]]", "[[Identity and Access]]"]
---

# Architecture Overview

*How River Portal is built: Node.js and TypeScript on Google Cloud, Firebase as the content and data platform, Identity-Aware Proxy for staff and Vertex AI as an advisory assistant.* Back to [[00 Home]].

The architecture is a direct translation of [[The River Concept]]: **every action is sediment** (an append-only [[Log Event]]), and **everything anyone sees is the surface** (a rebuildable [[Projection]]). Nothing in the portal is a hand-edited number.

> [!principle] Architectural non-negotiables
> 1. **All writes are commands.** Clients never write domain data to Firestore; the command API appends events. ([[ADR-001 Event-Sourced Append Log]], [[Guiding Principles#P7. The river remembers]])
> 2. **Private by default, per field.** Projections redact per audience using [[Visibility Levels]]. ([[ADR-006 Private by Default Visibility]])
> 3. **The left bank is always open.** Need intake works without an account and is never gated by [[Reputation]]. ([[ADR-005 Open Access for Recipients]])
> 4. **Staff surfaces sit behind IAP.** No staff screen is reachable from the public internet without a Google identity. ([[ADR-003 IAP for Staff Sections]])
> 5. **AI advises, humans decide.** Every Vertex action is logged `via: vertex` and never auto-publishes. ([[Vertex AI Integration]])

## Section contents

| Note | Question it answers |
|---|---|
| [[Technology Stack]] | What we use, why, and what we considered instead |
| [[Frontend Application]] | How `web` and `studio` are structured (Next.js App Router, RSC, PWA) |
| [[Firebase Data Model]] | The Firestore collection tree, document shapes and indexes |
| [[Event Log and Projections]] | Command handling, the append-only log, projectors, replay, crypto-shredding |
| [[Event Catalogue]] | Every event type, its payload, visibility and affected projections |
| [[Identity and Access]] | Who signs in how; roles, scopes and authorisation |
| [[IAP Staff Access]] | Load balancer + IAP set-up, JWT verification, break-glass |
| [[Security Rules]] | Firestore and Storage rules |
| [[Content Management]] | Block JSON, live data blocks, media pipeline |
| [[Internationalisation]] | next-intl, ICU messages, translation workflow |
| [[Vertex AI Integration]] | Gemini use cases and guard-rails |
| [[Notifications]] | Email, SMS, Web Push, messengers via Pub/Sub |
| [[Deployment and Environments]] | Projects, Terraform, CI/CD, backups |
| [[Scaling Architecture]] | Tier 1 → Tier 4 technical evolution |
| [[Observability]] | Logs without PII, tracing, SLOs, projection lag |

**Architecture decision records:** [[ADR-001 Event-Sourced Append Log]] · [[ADR-002 Firebase as Content and Data Platform]] · [[ADR-003 IAP for Staff Sections]] · [[ADR-004 Next.js on Cloud Run]] · [[ADR-005 Open Access for Recipients]] · [[ADR-006 Private by Default Visibility]]

## System context (C4 level 1)

```mermaid
flowchart TB
    R([Recipient<br/>Olena]):::person
    G([Giver / Sponsor<br/>James, Sarah]):::person
    K([Carrier<br/>Mykola]):::person
    V([Volunteer]):::person
    S([Staff: Coordinator, Editor,<br/>Finance Steward, Admin, Auditor]):::staff
    PUB([Public and press]):::person

    RP[[River Portal]]

    PAY[(Payment providers<br/>Stripe, bank, Monobank jar)]
    MSG[(Messaging providers<br/>email, SMS, Telegram/Viber)]
    GW[(Google Workspace /<br/>Cloud Identity)]
    VX[(Vertex AI — Gemini)]

    R -->|asks for help, confirms receipt| RP
    G -->|offers, pledges, reads reports| RP
    K -->|leg checklist, handover, costs| RP
    V -->|tasks, translation| RP
    PUB -->|reads stories, ledger| RP
    S -->|coordinates, edits, approves via IAP| RP
    RP -->|checkout links; receives webhooks| PAY
    RP -->|sends notifications| MSG
    RP -->|staff identity and groups| GW
    RP -->|advisory drafts, redacted prompts| VX
    classDef person fill:#e8f4ff,stroke:#2a6fb0
    classDef staff fill:#fff3e0,stroke:#c77700
```

## Containers (C4 level 2)

```mermaid
flowchart LR
    subgraph Edge["Edge"]
        FH[Firebase Hosting / Cloud CDN]
        LB[External HTTPS LB + IAP]
    end
    subgraph Run["Cloud Run"]
        WEB[web<br/>Next.js public site]
        STU[studio<br/>Next.js staff app]
        API[river-api<br/>Fastify command API]
    end
    subgraph Data["Firebase / GCP data"]
        EV[(Firestore<br/>orgs/*/events)]
        VW[(Firestore<br/>orgs/*/views)]
        PB[(Firestore<br/>public/*)]
        PPL[(Firestore<br/>orgs/*/people/*/private)]
        ST[(Cloud Storage<br/>media)]
        KMS[Cloud KMS<br/>per-person keys]
    end
    subgraph Async["Async"]
        PJ[functions/projectors<br/>Cloud Functions 2nd gen]
        PS[[Pub/Sub topics]]
        NT[notifier function]
        MP[media pipeline function]
        BQ[(BigQuery export<br/>Tier 3–4)]
    end
    AUTH[Firebase Auth]
    VX[Vertex AI]

    FH --> WEB
    LB --> STU
    WEB -->|commands| API
    STU -->|commands + IAP identity| API
    WEB -->|reads| PB
    STU -->|reads| VW
    API -->|append, transaction| EV
    API -->|PII write| PPL
    API --> KMS
    API --> VX
    EV -->|onDocumentCreated| PJ
    PJ --> VW
    PJ --> PB
    PJ --> PS
    PS --> NT
    ST --> MP
    MP --> API
    EV -.-> BQ
    WEB --> AUTH
    API --> AUTH
```

## Request paths

| Path | Entry | Identity | Reads from | Writes via |
|---|---|---|---|---|
| **Public** (web) | Firebase Hosting → Cloud Run `web` | Anonymous, or Firebase Auth ID token; tracking token for no-account recipients | `public/{orgId}/…` (ISR-cached), own-subject views via `river-api` | `river-api` `/commands/*` |
| **Staff** (studio) | External HTTPS LB → IAP → Cloud Run `studio` | Google Workspace identity, IAP JWT verified | `orgs/{orgId}/views/…` via server components (Admin SDK, scoped) | `river-api` with forwarded IAP assertion |
| **Command API** | `api.<domain>` via LB (public routes) and internal ingress (studio routes) | Firebase ID token, tracking token, leg magic link, IAP JWT, or provider webhook signature | Aggregate state rebuilt from events / snapshot | Firestore transaction on `events` |
| **Carrier** | web PWA `/leg/{token}` | Leg-scoped magic link | Leg projection | `river-api` leg commands |

See [[Identity and Access]] for the full matrix.

## Write path and read path

```mermaid
sequenceDiagram
    autonumber
    participant C as Client (web / studio)
    participant A as river-api
    participant F as Firestore events
    participant P as Projector function
    participant V as views / public
    C->>A: POST /commands/need.submit {idempotencyKey, expectedSeq}
    A->>A: authenticate, authorise (role + scope), validate (zod)
    A->>F: transaction: check seq, append need.Submitted
    F-->>A: committed (eventId, seq)
    A-->>C: 202 {eventId, aggregateId, trackingUrl?}
    F-)P: onDocumentCreated
    P->>V: upsert views/needQueue, public/stats
    Note over C,V: Read path: clients read projections only, never events
    C->>V: read projection (RSC / ISR, or listener in studio)
```

- **Write path**: command → authorise → validate → load aggregate → decide → append event(s) in one transaction. Details in [[Event Log and Projections]].
- **Read path**: projections are eventually consistent (target p95 lag < 5 s, see [[Observability]]). The command response returns enough for optimistic UI.

## Key cross-cutting concerns

- **PII** lives only in `people/{personId}/private`, encrypted with per-person KMS keys; events carry ids. See [[Firebase Data Model]], [[Privacy Model]], [[Data Minimisation]].
- **Decisions** ([[Decision Points Overview]]) are recorded as events carrying `dp: "DP-04"` metadata, giving the [[Accountability and Audit]] trail.
- **Tiers**: the same containers serve all four [[Scaling Tiers]]; features are toggled by organisation configuration. See [[Scaling Architecture]].
