---
type: architecture
status: draft
tags: [architecture, event]
aliases: [AGGREGATE.PastTense]
related: ["[[Event Catalogue]]", "[[Log Event]]"]
created: {{date}}
---

# {{title}}

> [!info] Using this template
> Event types are normally catalogued as rows in [[Event Catalogue]]; use this template only for an event complex enough to need its own section there or a separate note (which must then be added to [[Vault Map]]). Name: `aggregate.PastTense` ([[Conventions#Naming]]). Delete this callout when done.

*What happened, in one sentence, in the past tense.* Back to [[Event Catalogue]].

| Field | Value |
|---|---|
| Type | `aggregate.PastTense` |
| Aggregate kind | e.g. `need` → [[Need]] |
| Emitted by command | `…` in river-api |
| Typical actor | Role · via (`web` / `studio` / `api` / `system` / `vertex`) |
| Default visibility | `team` (see [[Visibility Levels]]) |
| Schema version | 1 |
| Decision point | `[[DP-NN Title]]` or none |
| Introduced | {{date}} |

## Envelope

Standard fields from [[Event Log and Projections]]: `id` (ULID), `type`, `aggregate {kind, id}`, `orgId`, `actor {personId|null, role, via}`, `occurredAt`, `recordedAt`, `payload`, `visibility`, `correlationId`, `causationId`, `schemaVersion`.

## Payload

| Field | Type | Required | Visibility | Notes |
|---|---|---|---|---|
| … | … | … | … | Never a name, phone, address or health detail — reference `personId` ([[Privacy Model#Separation of PII from events]]) |

## Example

```json
{
  "id": "01J...",
  "type": "aggregate.PastTense",
  "aggregate": { "kind": "aggregate", "id": "..." },
  "orgId": "demo-ora",
  "actor": { "personId": "per_...", "role": "coordinator", "via": "studio" },
  "occurredAt": "{{date}}T10:00:00Z",
  "recordedAt": "{{date}}T10:00:02Z",
  "payload": {},
  "visibility": "team",
  "correlationId": "...",
  "causationId": "...",
  "schemaVersion": 1
}
```

## Validation rules

- Preconditions on aggregate state (from its lifecycle).
- Invariants checked by the command handler.

## Consumers

| Projection / handler | Effect |
|---|---|
| `orgs/{orgId}/views/...` | … |
| `public/{orgId}/...` | … (only sanitised fields) |
| [[Notifications]] | … |
| [[Reputation Signals]] | … |

## Corrections

How a mistaken event is corrected by a later event (never edited or deleted — [[ADR-001 Event-Sourced Append Log]]).

## Related
[[Event Catalogue]] · [[Log Event]] · [[Projection]] · …
