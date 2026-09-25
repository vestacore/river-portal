---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, context]
---

# The Portal at a Glance

Back to [[00 SDLC Home]].

River Portal is a charity portal built on one image: **help as a river**.
- Needs stand on the left bank, and gifts on the right.
- Coordinators and carriers are the channel; reputation is the current.
- **The left bank is always open**: anyone may ask.
- Privacy is strict, and a gift is a gift, not a purchase.
- Every public number is derived from an append-only log of events.

| Aspect | State at `ddb01cc` |
|---|---|
| Surfaces | A public site and a staff studio behind Identity-Aware Proxy, from one Next.js app (`adr/records/ADR-0010`). Locally, or in a sandbox, a demo sign-in shows every role |
| Languages | British English and Ukrainian throughout; documentation in British English |
| Stack | Next.js 16.3, React 19.1, Tailwind CSS 4.1, Tiptap 3.30, TypeScript 5.9 without a build step, Node 22, Firestore, Vertex AI, Pulumi on Google Cloud (Cloud Run, load balancer, Cloud Armor, IAP) |
| Code | 17 domain packages in 7 groups; `apps/web`; `infra`; `tools` (see [[Code Measurements 2026-09-25]]) |
| Domain | Needs, gifts, flows, costs, confirmations, gratitude, reports, a feed, settings, identities; 9 demo personas; 3 organisation profiles |
| Documentation | `spec/`: 146 notes · `adr/`: 23 decisions · `meta/`: 5 iterations, 7 observations, 4 registers, 1 review |
| Status | Research preview; three hard gates stand before real personal data (see [[Privacy and Safety Gates]]) |

The product's own ideas return in how it is built. See [[The Process Mirrors the Product]].
