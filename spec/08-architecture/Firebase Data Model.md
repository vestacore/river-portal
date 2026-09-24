---
type: architecture
status: draft
tags: [architecture, firestore, data-model, privacy/sensitive]
aliases: [Data Model, Firestore Model]
---

# Firebase Data Model

The Firestore collection tree, document shapes, indexes and where personal data lives. Back to [[Architecture Overview]]. Decision: [[ADR-002 Firebase as Content and Data Platform]].

Firestore holds four kinds of data, each with different rules:

| Kind | Path | Written by | Read by |
|---|---|---|---|
| **Log** (source of truth) | `orgs/{orgId}/events/{eventId}` | `river-api` only | projectors, auditors (via studio) |
| **Aggregate heads** (concurrency + snapshots) | `orgs/{orgId}/aggregates/{kind}_{id}` | `river-api` only, same transaction | `river-api` |
| **Staff views** (projections) | `orgs/{orgId}/views/{view}/…` | projectors only | studio (scoped) |
| **Public views** (sanitised projections) | `public/{orgId}/…` | projectors only | anyone |
| **PII vault** | `orgs/{orgId}/people/{personId}/private/{doc}` | `river-api` only | `river-api` only (decrypts per request) |

## Collection tree

```text
orgs/{orgId}                                  # Organisation config (non-PII): name, locales, tier, features
├─ events/{eventId}                           # append-only Log Events (ULID ids)
├─ aggregates/{kind}_{aggregateId}            # {seq, snapshot?, snapshotSeq, updatedAt}
├─ idempotency/{key}                          # {eventIds, responseHash, expiresAt}  (TTL 7 days)
├─ accessTokens/{sha256}                      # hashed tracking tokens and leg magic links
├─ notifications/{dedupeKey}                  # delivery status per event × person × channel (TTL 90 days)
├─ people/{personId}                          # non-PII person stub: roles, locale, pseudonym
│  └─ private/profile                         # encrypted PII: name, phone, email, address
│  └─ private/keys                            # keyRef → wrapped DEK in the separate `keystore` database
├─ views/
│  ├─ needQueue/items/{needId}                # triage queue rows (team)
│  ├─ needs/items/{needId}                    # staff need view, level team
│  │  └─ lvl/private, lvl/sealed              # stricter fields split out per level (see Security Rules)
│  ├─ flows/items/{flowId}                    # flow board: gifts, needs, consignments, legs, costs
│  ├─ legs/items/{legId}                      # carrier-facing leg view
│  ├─ ledger/entries/{entryId}                # money in/out, per campaign/flow
│  ├─ reputation/subjects/{personId}          # signals + contributing eventIds
│  ├─ consents/subjects/{personId}            # active consents
│  ├─ auditTrail/decisions/{eventId}          # DP decisions index
│  ├─ inventory/hubs/{hubId}/items/{itemId}
│  └─ subjects/{personId}/…                   # own-subject views: my needs, my gifts, my signals
├─ content/{articleId}                        # draft content blocks (studio)
│  └─ revisions/{revId}
└─ media/{mediaId}                            # Media Asset metadata (visibility, consentId, renditions)

public/{orgId}                                # sanitised read models (world-readable)
├─ stats/live                                 # counters for live data blocks
├─ campaigns/{slug}
├─ stories/{slug}                             # published Journey Stories, per locale
├─ ledger/{campaignOrPeriod}
├─ gratitude/{noteId}                         # consented Gratitude Wall entries
├─ map/{bucket}                               # coarse (oblast-level) flow map tiles
└─ pages/{slug}                               # published Articles / Reports
```

Wrapped DEKs live in a separate named Firestore database, `keystore/{orgId}/deks/{personId}`, readable only by `river-api`'s service account, with short backup retention so that erasure cannot be undone by a restore (see [[Deployment and Environments#Backups and recovery]]).

Tracking tokens for no-account recipients and carrier magic links are stored hashed in `orgs/{orgId}/accessTokens/{sha256}` with `{scope, subjectRef, expiresAt, revokedAt}`. See [[Identity and Access]].

## Core document shapes

```ts
// packages/domain/src/event.ts
export type Visibility = 'sealed' | 'private' | 'team' | 'participants' | 'public';
export type Via = 'web' | 'studio' | 'api' | 'system' | 'vertex';

export interface LogEvent<T extends string = string, P = unknown> {
  id: string;                         // ULID, sortable by time
  type: T;                            // e.g. 'need.Submitted'
  aggregate: { kind: AggregateKind; id: string };
  seq: number;                        // per-aggregate sequence, 1-based, gap-free
  orgId: string;
  actor: { personId: string | null; role: RoleName | 'anonymous' | 'system'; via: Via };
  occurredAt: string;                 // ISO 8601, client/business time
  recordedAt: FirebaseFirestore.Timestamp; // server time
  payload: P;                         // NO PII — ids and references only
  visibility: Visibility;             // default level of the event
  fieldVisibility?: Record<string, Visibility>; // per-field overrides
  correlationId: string;              // whole user journey / command chain
  causationId: string | null;         // event or command that caused this one
  schemaVersion: number;
  dp?: DecisionPointId;               // 'DP-04' when the event records a decision
  prevHash?: string;                  // optional hash chain (see Event Log and Projections)
}

// people stub — safe to reference from views
export interface PersonDoc {
  id: string;
  pseudonym: string;                  // "a family in Kharkiv oblast" generated per context
  locale: 'en-GB' | 'uk' | string;
  roles: RoleGrant[];                 // mirror of role.* events
  contactChannels: Array<'email' | 'sms' | 'push' | 'telegram' | 'viber'>;
  erased: boolean;                    // set on person.KeyShredded (crypto-shredded)
}

// PII vault — encrypted field-by-field with the person's DEK
export interface PersonPrivateProfile {
  keyRef: string;                     // pointer to private/keys
  name?: Encrypted<string>;
  phone?: Encrypted<string>;
  email?: Encrypted<string>;
  address?: Encrypted<PostalAddress>;
  safeguardingNotes?: Encrypted<string>; // visibility: sealed
}
export interface Encrypted<T> { ciphertext: string; iv: string; alg: 'AES-256-GCM'; _t?: T }

// staff need view (projection)
export interface NeedView {
  id: string;
  status: NeedStatus;                 // see Need
  category: string;                   // Category id
  form: 'goods' | 'money' | 'service' | 'transport';
  summary: Redactable<string>;        // Recipient's words; may be Vertex-summarised (flagged)
  location: { oblast: string; hromada?: Redactable<string> };
  recipientRef: string;               // personId, never name
  assignedCoordinators: string[];
  verificationDepth: 'light' | 'standard' | 'enhanced';
  flows: string[];
  lastEventId: string;
  updatedAt: FirebaseFirestore.Timestamp;
}
export type Redactable<T> = { level: Visibility; value?: T }; // value omitted when caller below level

// public campaign (projection) — already aggregated
export interface PublicCampaign {
  slug: string;
  title: Record<string, string>;      // per locale
  goal: { amount: number; currency: string };
  raised: { amount: number; currency: string; givers: number };
  costs: Array<{ kind: CostKind; amount: number; currency: string }>;
  deliveries: number;
  journeyStorySlugs: string[];
  updatedAt: string;
}
```

## Where PII lives

> [!privacy] PII never enters the log
> Names, phone numbers, emails, addresses, free-text safeguarding notes and precise locations live **only** in `people/{id}/private/*`, encrypted with the person's data encryption key (DEK), itself wrapped by a Cloud KMS key. Events and views reference `personId`. Free-text fields in events (e.g. a need description) pass a PII scan in `river-api` before append; detected identifiers are moved into the vault and replaced with `{{pii:ref}}` tokens. See [[Data Minimisation]] and [[Event Log and Projections#Crypto-shredding]].

| Data | Location | Level |
|---|---|---|
| Recipient name, phone, address | `people/*/private/profile` (encrypted) | `private` |
| Safeguarding notes | `people/*/private/profile.safeguardingNotes` | `sealed` |
| Need description (recipient's own words) | event payload, PII-scanned **and** encrypted with the recipient's DEK → `views/needs/…/lvl/private` | `private` (team sees summary) |
| Exact delivery address | `people/*/private` → leg view resolves for assigned carrier only, at leg time | `private` |
| Giver amount | event payload | `private`; public only aggregated |
| Receipt photos | Storage `orgs/{orgId}/receipts/…` | `team` |

## Public vs staff views

The same projector writes both; redaction uses `redactFor(audience)` from `packages/domain`:

```ts
export function redactFor<T>(doc: T, fieldLevels: Record<string, Visibility>, audience: Visibility): Partial<T>;
// order: sealed > private > team > participants > public
```

Public projections additionally apply **k-anonymity thresholds** (no counts < 5 per oblast per month) and **location coarsening** (oblast level). See [[Visibility Levels]] and [[Privacy Model]].

## Indexes

| Collection group | Fields | Used by |
|---|---|---|
| `events` | `aggregate.kind ASC, aggregate.id ASC, seq ASC` | aggregate load / replay |
| `events` | `type ASC, recordedAt ASC` | targeted projection rebuild |
| `events` | `correlationId ASC, recordedAt ASC` | audit trail of a journey |
| `events` | `dp ASC, recordedAt DESC` | [[Accountability and Audit]] |
| `needQueue/items` | `status ASC, triagePriority DESC, submittedAt ASC` | coordinator queue |
| `flows/items` | `leadCoordinator ASC, status ASC, updatedAt DESC` | "my flows" |
| `ledger/entries` | `campaignId ASC, occurredAt DESC` | ledger |

`triagePriority` is derived from urgency declared and time waiting — **never** from reputation ([[ADR-005 Open Access for Recipients]]).

Firestore TTL policies: `idempotency.expiresAt`, `accessTokens.expiresAt`. Retention of views follows [[Data Retention]].
