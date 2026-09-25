---
type: process
status: draft
tags: [process, assumptions]
---

# Nearest-Variant Assumptions

Product questions from `spec/00-meta/Open Questions.md` that code now depends on, with the variant we took. Revisit each one when the owner decides. Back to [[00 Meta Home]].

| Open question | Variant taken in code | Where it lives | Revisit when |
|---|---|---|---|
| Framework (Next.js vs Nuxt/Astro) | Next.js 16.1 | ADR-0004 | After the `/ask` bundle test on a mid-range phone |
| Multi-tenancy | Single organisation per deployment. `orgId` is present in every path, so multi-tenancy stays possible | `@river/store` paths | Second organisation onboarding |
| Offline scope | None yet; forms work without JavaScript (Server Actions) | `/ask`, `/track` | Field test with recipients |
| Vertex v1 scope | Feed snippet suggestions only (plus a redaction pre-pass) | ADR-0013 | After first editor feedback |
| Payments at Tier 1 | Pledges recorded; receipt marked by a coordinator; no payment provider yet | `@river/gifts` | Before real fundraising |
| Crypto-shredding | Not implemented; personal data isolated in `private` documents | ADR-0011 | Before real personal data (hard gate) |
| Russian intake page | Not offered | `@river/i18n` | — |
| Map / Flow Map | Not in iteration 1 | — | Iteration 3 |
| 72-hour delay for public aggregates | Counters update immediately | `@river/pages` sitePageProjector | Before real data (TD-08) |
| Firebase features | Firestore only (server-side). Firebase Auth arrives with giver and recipient accounts | ADR-0011 | Iteration adding accounts |
| Staff roles | Everyone passing IAP is a coordinator; `RIVER_STAFF_ROLES` lists administrators and editors | `apps/web/lib/getStaff.ts` | More than 10 staff (TD-05) |

