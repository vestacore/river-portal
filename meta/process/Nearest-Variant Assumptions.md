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
| No Russian intake page | Not offered | `@river/i18n` | — |
| Map / Flow Map | Not in iteration 1 | — | Iteration 3 |
| 72-hour delay for public aggregates | Counters update immediately | `@river/pages` sitePageProjector | Before real data (TD-08) |
| Firebase features | Firestore only (server-side). Firebase Auth arrives with giver and recipient accounts | ADR-0011 | Iteration adding accounts |
| Staff roles | Everyone passing IAP is a coordinator; `RIVER_STAFF_ROLES` gives others one or more roles (`a@x:administrator\|editor`) | `apps/web/lib/staffRolesFor.ts` | More than 10 staff (TD-05) |
| Public sign-in | Demo personas with a signed session locally and in a sandbox; no sign-in on the public surface | ADR-0021 | Firebase sign-in (TD-15) |
| Kinds of organisation | Three profiles of settings: state programme, city foundation, small nationwide | ADR-0020 | A fourth kind asks for different parameters |
| Registered carriers | The carrier personas of the demo | `studio/needs/[id]` dispatch form | A people registry (TD-20) |
| Headline of the home page | The organisation's tagline (`{{org.tagline}}`), editable as a site text | `siteBlocks` | Editors ask for a separate headline |
| Share of money spent on delivery | Shown in the trust strip for every profile; in-kind gifts have no money value | `TrustStrip`, Transparency caveats | In-kind gifts get a declared value |
| Payment river: who a merchant or a payer is | Demo personas with a signed cookie; a payer needs no account at all (the pay link is the key); in the cloud only the operator signs in (IAP) | ADR-0025, `apps/web/lib/pay/getPayActor.ts` | Public accounts (TD-15), or the first real merchant |
| Payment river: how merchants are registered | A list in Pulumi config (`payMerchants`), with the providers each has connected | `infra/src/readPaySettings.ts` | Merchants onboard themselves |
| Payment river: how functions are packaged | Cloud Run services from one container image, one function each; not the Cloud Functions build | ADR-0025 §7, `Dockerfile.pay` | The owner prefers the Functions product surface |
| Payment river: who retries a failed crossing | The payer asks again; the river then tries another provider first. No automatic failover | `packages/pay/flow/checkoutGate.ts` | Sandbox experience with real provider outages |
| Payment river: what an operator does with a flag | Sees it, with the reason. Refunds and corrections are not built | ADR-0025 follow-ups | Before real money |
| Payment river: currencies | EUR, USD, GBP, UAH; two decimal places assumed | `packages/pay/facts/types/Currency.ts` | A currency with other minor units |
| Payment river: providers in a sandbox | Stand-ins under the providers' own names, marked `simulated` on every fact and every page; refused in the cloud unless explicitly allowed | `packages/pay/providers/simulatedProvider.ts` | Test-mode keys are available |
| Payment river: how long a provider's page stays open | 180 minutes for every provider (`paySessionTtlMinutes`); sent to Stripe as the session's expiry, assumed for PayPal | `packages/compose/pay-runtime/closeAbandoned.ts` | PayPal's sandbox shows its real approval window |
| Payment river: who decides a withdrawal | The figure, inside the wave; refused while a payment is being collected. A page the payer has not completed is not closed at the provider | `packages/pay/flow/decideCancellation.ts` | Session expiry at the provider is built |
