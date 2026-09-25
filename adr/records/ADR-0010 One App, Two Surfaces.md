---
type: adr
status: accepted
date: 2026-09-24
tags: [adr, deployment]
spec: spec/08-architecture/adr/ADR-003 IAP for Staff Sections.md
---

# ADR-0010 One App, Two Surfaces

## Context
The spec describes two Next.js apps, `web` (public) and `studio` (IAP). In-place editing ([[ADR-0006 In-Place Editing with Tiptap]]) means staff must see *the public pages themselves* in edit mode, and two apps would duplicate every page.

## Decision
- **One Next.js application**, built into one container image, deployed as **two Cloud Run services** with different settings:
  - `web`: `RIVER_SURFACE=public`. The `/studio` routes return 404, edit mode is impossible, and the service account has read-mostly permissions.
  - `studio`: `RIVER_SURFACE=studio`. It sits behind IAP on host `studio.<domain>`. `proxy.ts` verifies the IAP JWT (`x-goog-iap-jwt-assertion`) on every request, maps the identity to roles, and enables `/studio` and edit mode.
- Locally, `RIVER_SURFACE=local` enables both with a development identity.
- Host-based routing on the load balancer: `<domain>` → web, `studio.<domain>` → studio.

## Consequences
- **Positive**: one codebase and image; editors edit the real page.
- **Negative**: studio code is present in the public image, although unreachable. Guarded by the surface check in `proxy.ts` and in every Server Action (defence in depth), and verified by tests.

## Alternatives considered
| Option | Why not (now) |
|---|---|
| Two apps | Duplication of pages; in-place editing would need a shared package of pages anyway |
| Path-based `/studio` with IAP on the same host | IAP would need a separate backend anyway; host separation keeps cookies and caching clean |

## Implementation notes (2026-09-24)
- The IAP JWT audience is checked against the **project prefix** `/projects/<number>/global/backendServices/`. The exact backend id would create a dependency cycle in Pulumi (the service's environment would depend on the backend, which depends on the service). Tracked as TD-12.
- IAP uses the Google-managed OAuth client, which serves users in the same Google Workspace organisation. External staff will need a custom OAuth client (config values to be added).

Back to [[00 ADR Home]].
