---
type: architecture
status: draft
tags: [architecture, security, firestore, storage, privacy/sensitive]
aliases: [Firestore Rules, Storage Rules]
---

# Security Rules

Firestore and Cloud Storage rules for River Portal. Back to [[Architecture Overview]]. Data layout: [[Firebase Data Model]]. Authorisation logic: [[Identity and Access]].

## Principles

1. **Deny by default.** Every path not explicitly matched is closed.
2. **Clients never write domain data.** `events`, `aggregates`, `views`, `people`, `public` are written only by server code using the Admin SDK (which bypasses rules). Rules therefore deny all client writes to them. ([[ADR-001 Event-Sourced Append Log]])
3. **The log is immutable even to mistakes in our own code paths.** Rules deny update/delete on `events` for every client; server code uses `create()` only, enforced by lint rule and unit test. Deletion of the log is additionally blocked by IAM (no service account holds `datastore.entities.delete` on the production database outside the erasure job, which touches only `people/*/private`).
4. **Public projections are read-only and world-readable.** Everything under `public/{orgId}` is already redacted to `public` by projectors.
5. **Staff views are read-only and claim-gated.** Studio listeners need `staff == true` and org membership; field-level redaction already happened in the projection (per-level sub-documents, see below).
6. **PII is never client-readable.** `people/*/private/*` is closed to all clients; only `river-api` decrypts, per request, for authorised callers.
7. **Rules are tested** in CI with the Firebase Emulator Suite (`@firebase/rules-unit-testing`); a rules change without tests fails the pipeline.

## Level-split views

Firestore rules cannot hide individual fields of a document, so projections store one document **per visibility level** where needed:

```text
orgs/{orgId}/views/needs/items/{needId}              # level: team   (summary, status, oblast)
orgs/{orgId}/views/needs/items/{needId}/lvl/private   # level: private (assigned coordinators)
orgs/{orgId}/views/needs/items/{needId}/lvl/sealed    # level: sealed  (safeguarding lead + assigned)
```

Access lists (`readers`) on the `private` / `sealed` sub-documents are maintained by the projector from `role.*` and `flow.Coordinator*` events.

## Firestore rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {

    function signedIn()       { return request.auth != null; }
    function isStaff()        { return signedIn() && request.auth.token.staff == true; }
    function inOrg(orgId)     { return signedIn() && orgId in request.auth.token.orgs; }
    function hasRole(orgId, r){ return inOrg(orgId) && r in request.auth.token.orgs[orgId]; }
    function uid()            { return request.auth.uid; }   // == personId for public users

    // ---------- public projections: world-readable, never client-writable
    match /public/{orgId}/{document=**} {
      allow read: if true;
      allow write: if false;
    }

    match /orgs/{orgId} {
      allow read: if isStaff() && inOrg(orgId);   // non-PII organisation config
      allow write: if false;

      // ---------- the append-only log
      match /events/{eventId} {
        allow read: if isStaff() && hasRole(orgId, 'auditor');   // log explorer; payloads have no PII
        allow create, update, delete: if false;                  // server-only create, never update/delete
      }
      match /aggregates/{id}   { allow read, write: if false; }
      match /idempotency/{id}  { allow read, write: if false; }
      match /accessTokens/{id} { allow read, write: if false; }

      // ---------- PII vault: never readable by any client
      match /people/{personId} {
        allow read: if isStaff() && inOrg(orgId);   // stub only: pseudonym, roles, locale
        allow write: if false;
        match /private/{doc} { allow read, write: if false; }
      }

      // ---------- staff views
      match /views/{view}/items/{itemId} {
        allow read: if isStaff() && inOrg(orgId);   // level: team
        allow write: if false;

        match /lvl/private {
          allow read: if isStaff() && uid() in resource.data.readers;
        }
        match /lvl/sealed {
          allow read: if isStaff() && hasRole(orgId, 'safeguardingLead')
                      && uid() in resource.data.readers;
        }
      }

      // ---------- own-subject views for public users (my needs, my gifts, my signals)
      match /views/subjects/{personId}/{document=**} {
        allow read: if signedIn() && uid() == personId;
        allow write: if false;
      }

      // ---------- content drafts (studio only)
      match /content/{articleId}/{document=**} {
        allow read: if isStaff() && (hasRole(orgId, 'editor') || hasRole(orgId, 'coordinator'));
        allow write: if false;                       // saves go through river-api (article.Revised)
      }
    }
  }
}
```

Notes:
- Reads of `lvl/sealed` are also logged server-side: studio fetches sealed content through `river-api` (which appends `system.SealedAccessed`) rather than a listener. The rule above is a second line of defence.
- No-account recipients and magic-link carriers have **no** Firestore access at all; they read through `river-api` with their token.

## Storage rules

Uploads go **directly from the client** to a quarantine prefix (large photos on poor connections), then the media pipeline moves them. See [[Content Management#Media pipeline]].

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // quarantine: client may create one object, max 15 MB, images/PDF only; never read back
    match /quarantine/{orgId}/{uploadId}/{file} {
      allow create: if request.auth != null
                    && request.resource.size < 15 * 1024 * 1024
                    && request.resource.contentType.matches('image/(jpeg|png|webp|heic)|application/pdf')
                    && request.resource.metadata.uploadTicket == uploadId;   // ticket issued by river-api
      allow read, update, delete: if false;
    }

    // public renditions: EXIF-stripped, consented, served via CDN
    match /public/{orgId}/{mediaId}/{rendition} {
      allow read: if true;
      allow write: if false;
    }

    // everything else (receipts, evidence, private media): signed URLs from river-api only
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

No-account recipients and magic-link carriers upload with a **Firebase anonymous auth** session bound to an `uploadTicket` minted by `river-api` for their token's scope; the ticket expires in 15 minutes.

## Testing matrix (excerpt)

| Case | Expected |
|---|---|
| Anonymous reads `public/open-river-aid/campaigns/fuel-3-convoys` | allow |
| Giver writes `orgs/open-river-aid/events/x` | deny |
| Coordinator updates an existing event | deny |
| Coordinator reads `views/needs/items/n1/lvl/private` not in `readers` | deny |
| Administrator (not safeguarding lead) reads `lvl/sealed` | deny |
| Any client reads `people/p1/private/profile` | deny |
| Recipient reads `views/subjects/{own uid}/needs/n1` | allow |

See [[Privacy Model]] and [[Visibility Levels]].
