---
type: iteration
status: review
date: 2026-10-19
tags: [iteration, payments, psp, hierarchy, agents, ui, i18n]
---

# Iteration 06 — PSP Portal

Back to [[00 Meta Home]]. On the branch `psp`; the decision is `adr/records/ADR-0026 PSP Portal — Four Boundaries Around the Payment Session.md`.

## Goal
- **The owner's request.** Collapse every template of the portal — the charity portal and the payment river's cabinets, which had grown as levels — into one PSP portal that is its own showcase and its own demo, filling every section from the topology of a standard PSP.
- **The river** is an attempt to pay: the passage from unpaid to paid.
- **Six traits** to build: split; a hierarchy of units in the manner of Active Directory; every payment instrument first-class; the whole cycle of a payment with its projections in view; agent swarms that help people see, track, control and decide; invoicing, orders and tracking.
- **Ukrainian and English**, defaulting to the browser's language. Infographics from the river, its streams and its bridges — events where information forms unified projections.
- **A home page for business with articles; six cabinets**: integrator, operator, AML and merchant compliance, contracts and access, pay page settings, hierarchy administrator.
- **Universal React panels**: tables, dashboards with charts, panels of fields.
- **Learn from** `riverpay/portal_v2` and `riverpay/checkout`; embed the pay page in the demo.
- **Walk the paths of each role with screenshots** while building.
- **Modules with documented boundaries** around four entities: invoice, order, payment and payment session.

## Out of scope
A store for the PSP, real acquirers, signed webhook deliveries, settlement files, currency conversion, deployment. Each is a follow-up in ADR-0026.

## What was built
| Area | Result |
|---|---|
| Vocabulary | `@river/psp-facts`: four boundaries, nine stages, 57 fact types with owner, stage, speaker, the projections each forms, webhook release and bilingual meaning; a compile-time completeness check |
| Boundaries | `@river/psp-order`, `-invoice`, `-session`, `-payment`: view, projector, labels and pure readers each; depending on the vocabulary only — a new topology rule enforces it |
| Assemblies | `psp-units` (hierarchy, 28 policies, resolution with enforced settings and blocked inheritance), `psp-access` (8 roles, 22 permissions, grants down the tree, separation of duties), `psp-contracts`, `psp-risk`, `psp-instruments` (12 instruments, 9 rails, courses of bridges), `psp-split`, `psp-ledger`, `psp-flow`, `psp-checkout`, `psp-integration`, `psp-agents` (8 agents) |
| Surface and wiring | `@river/psp-views` (the river of one session with what each bridge formed, series, funnels, mixes); `@river/psp-runtime` (the world in memory, the one writer, stand-in banks, every cabinet's commands with their checks, the clock, the swarm, 75 days of history replayed through the same commands) |
| Showcase | Landing with live figures and the river drawing; six articles; pricing with a fee calculator; developers; a shop; the demo's entrance |
| Pay page | `/pay/[key]` and its tracking page: wallets, instruments by policy, card checks in the browser with test cards, the steps of each instrument, the split where wanted, the rest of a partly paid invoice |
| Cabinets | One `/cabinet` with 27 sections, a menu per role, profiles to switch, a scope picker; compliance and access pages and the integrator's and after-the-mouth pages were written by two agents in parallel |
| Panels | A grammar of cells; `DataTable`, `Panel`, `FieldGrid`, `Metric`, `FilterBar`, `FactTimeline`; five SVG charts; five river drawings |
| Languages | Locale from `Accept-Language` with weights, a cookie that wins, both languages in place, plurals by rule |
| Removed from `apps/web` | The charity portal's routes, studio and components; the `/pay` cabinets of ADR-0025; Tiptap. Their packages stay, with their tests |
| Records | ADR-0026; `TOPOLOGY.md` (shape, rule 7, the data flow of one payment session); this note; [[2026-10-19 What Walking the PSP Cabinets Found]] |

In numbers: 18 packages added (16 in `psp/`, one surface, one compose); about 7,200 lines in 240 files, and 420 lines of tests; the web app is about 8,500 lines in 142 files, after 118 files of the earlier portal left it. 31 new tests (114 in all). No external dependency was added; four were removed from the web app.

## Definition of done
- [x] Four boundaries, each a package behind its gate, depending on the vocabulary only — checked by the build.
- [x] Each of the six traits works in the demo and is explained in an article.
- [x] The six cabinets exist, each with its role's menu, overview and pages, in both languages.
- [x] The pay page works for every instrument; the payer's path from the shop to the receipt.
- [x] Replay gives the stored views; the ledger balances; splits sum; no high-risk proposal without a person.
- [x] `npm run check` passes; the production build passes.
- [x] Every role walked in the browser with screenshots; every page at phone width without horizontal scroll.
- [ ] Deployment — the infrastructure still describes the earlier portal's two surfaces.
- [ ] The owner's review of ADR-0026.

## Log
- 2026-10-19: Read both Flutter projects for content and structure: the portal's menus served per profile and its sections; the pay page's order of things — merchant bar, invoice, wallets, instruments, a card form that checks as one types, 3-D Secure as a modal, the result. No code taken.
- 2026-10-19: Vocabulary first, then the four boundaries, then the assemblies, each with its tests. The order of the work kept the boundary rule honest: nothing in a boundary could reach for another, because the other did not exist yet.
- 2026-10-19: The runtime's history: a seeded clock drives 75 days of trade through the same commands a payer and the cabinets use, with stories that need a person. Early runs found a correlation between the routing hash and the stand-in issuer (one acquirer approved everything), hundreds of overdue checkout invoices, and direct debits closed by a thirty-minute expiry. Each was a fault of the model and was fixed there.
- 2026-10-19: Removed the earlier portal from `apps/web` and built the showcase, the pay page and the operator's and administrator's cabinets; walked them with screenshots, fixing drawings that overlapped and labels that were cut.
- 2026-10-19: Two agents wrote the compliance and access pages and the integrator's and after-the-mouth pages in parallel, told to report — not fix — what they found wrong in the packages. Their seventeen findings, and the walk that followed, are in the observation; every one was reproduced first, and one turned out not to hold.
- 2026-10-19: Walked every role again, in both languages and at phone width; checked all 27 sections as eight people. `npm run check` and the production build pass.
- 2026-10-19: `npm audit` still reports the advisories that predate this branch, among them the critical one in `next` 16.3.5 (TD-30). Not addressed here.
