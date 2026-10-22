---
type: iteration
status: review
date: 2026-10-20
tags: [iteration, payments, orchestration, routing, on-us, reconciliation, retail, agents, ui, i18n]
---

# Iteration 07 — Payment Flow Orchestration

Back to [[00 Meta Home]]. On the branch `psp`. The decision is `adr/records/ADR-0027 Payment Flow Orchestration — Direct Settlement, Routing by Cost and Reconciliation.md`; it builds on [[Iteration 06 — PSP Portal]].

## Goal
- **The owner's reframing (2026-10-20).** The system is a payment flow orchestration platform with automation by agents, assembled per client. A PSP is a finished process and becomes one assembly.
- **The first client in view** is a large Ukrainian supermarket chain. Never name or guess it: the demo's group is invented.
- **Not** POS terminals, and **not** replacing the client's internal systems: glue them to payment instruments and orchestrations.
- Look at **on-us**, **interchange** and the PSP charges a large client does not need. Take away the PSP positioning without making the existing functionality shallower.
- **Then, after the proposal:**
  - a demo integration with the client's own bonus system;
  - reconciliation in a basic, universal form;
  - no treasury forecasting — that is the ERP's;
  - two new articles, "Routing and cost" and reconciliation;
  - routing on the home page with the emphasis on optimisation, on-us and cost;
  - calm, industrial, professional and accessible wording, without slogans;
  - one hero of on-us routing;
  - a review of every cabinet's demo from the frame.

## Out of scope
- Treasury forecasting.
- Processing store payments.
- Replacing the order, bonus or accounting systems.
- SSO and SCIM.
- The PCI DSS path of the card number.
- Real acquirers and bank files.
- Deployment.

## What was built
| Area | Result |
|---|---|
| Two assemblies | A retail group's stand beside the PSP's. Worlds are chosen by the person; pay keys are looked up in both; nine people of the group, each with a cabinet |
| Direct settlement | `settlement.model` as a policy, enforced at the group. The acquirer's fee is a share (`acquirer_fee`, recipient `acq:<id>`). The ledger reads clearing, fees and payables. Refunds and chargebacks are netted in later batches; no payouts, no reserve |
| A fifth boundary | `@river/psp-settlement`: `sales.Reported`, `settlement.Reported` (with lines by issuing bank and card product), `settlement.Credited` and `settlement.Resolved`. Batch views and three-way reconciliation with nine statuses. TOPOLOGY rule 7 names five boundaries |
| Cost | `AcquiringTerms`: blended, Interchange++ or on-us, per channel. `acquiringCostOf` prices one payment by part; the demo's interchange assumptions sit under the 1.2 % cap. A directory of invented issuers by BIN |
| Routing | Strategies `approval_first`, `least_cost` and `on_us_first`, with an approval threshold. Every decision is recorded with its alternatives. `simulateRouting` replays real sessions under another policy; `posOutlook` prices the tills from the banks' reports |
| Retail flows | Capture after picking (hold, picking, invoice adjusted, partial capture, release; refund where nothing could be held). Bonus points as a tender through the client's bonus system. Payment at the door. Corporate invoices on terms. A demo action reports picking as the order system would |
| Agents | The Navigator proposes strategies, terminal banks and on-us negotiations; the Reconciler proposes fee claims and break investigations. Findings of a standing condition form series and are refreshed or closed. The Treasurer is off for the group |
| Roles | Payments manager and finance controller, with `routing.write`, `costs.read` and `reconciliation.write` |
| Showcase | Home page with the on-us routing hero (drawn from the stand's terms and the routing function itself) and live figures. Eight articles: two new, six rewritten with the group's figures. "What a payment costs" (calculator by card and channel, how the platform is paid for, the PSP's tariffs). Developers' page for an order system. Header, footer and metadata of the platform |
| Cabinets | Routing studio, costs, settlements and a batch page with a person's decision, connections, overviews for the two new roles. The routing decision on a session's page; the cost of acceptance on a payment's page; picking and capture on an order's page. Hold, capture and release on the payer's tracking page. Retail menus and labels; acquiring terms instead of tariffs |
| Wording | The river stays on the drawings. Pages speak of events, shares and distribution; PSP-only phrases are gone from the retail pages and the pay page |
| Records | ADR-0027; `TOPOLOGY.md` (rule 7, the data flow of a settlement batch, regenerated table); this note; [[2026-10-20 What Reframing the PSP as Orchestration Found]] |

In numbers:
- 150 files changed (+2,399 / −890 lines) and 107 new files (5,436 lines).
- One package added (`@river/psp-settlement`); 48 packages in all.
- 129 tests (15 added); no external dependency added.
- The retail stand replays 75 days in about 3 seconds:
  - about 59,000 facts, 2,450 orders, 2,900 sessions and 1,900 settlement batches;
  - six holds wait for picking at the end of its history.

## Definition of done
- [x] Direct settlement, the settlement boundary, acquiring terms and routing v2 as packages with tests; the boundary rule checked by the build.
- [x] The retail stand's stories:
  - the change of strategy and its effect;
  - on-us kept away by the threshold;
  - the tills by region;
  - Stepove's overbilling;
  - a missing report, a short credit, a missing credit;
  - bonus points;
  - capture after picking.
- [x] Home page with routing and the on-us hero; the two new articles and six rewritten ones; both languages.
- [x] Every cabinet reviewed from the frame; new pages for routing, costs, settlements and connections.
- [x] `npm run check` and the production build pass (49 routes).
- [x] Every cabinet section requested as 15 people — the group's nine and the PSP's six, in Ukrainian or English: 200 where the profile may, 404 where it may not, 307 where the group's payouts lead to its settlements, no error page.
- [x] Every site page and every cabinet section of the group's administrator at phone width without horizontal scroll.
- [x] The payer's and the operator's path walked in the browser:
  - a shop order;
  - 120 points redeemed;
  - the rest held on a test card;
  - picking reported;
  - 313.40 of 325.00 captured, 11.60 released, explained on the tracking page.
- [ ] The owner's review of ADR-0027.
- [ ] Deployment.

## Log
- 2026-10-20: The proposal (in chat), with the market facts checked:
  - the interchange cap;
  - SEP 4.1;
  - open banking;
  - the register of payment infrastructure;
  - the share of online grocery.
- 2026-10-20: The packages first:
  - facts and instruments (bonus points, the issuer directory);
  - acquiring terms and their cost;
  - routing v2 and its replay;
  - the settlement boundary with its reconciliation;
  - the agents;
  - direct settlement in the split and the ledger;
  - the retail stand's seed with its stories and four tests.
- 2026-10-20: The web app on two worlds. The home page, the eight articles, "What a payment costs" and the developers' page were written in one voice, with one glossary.
- 2026-10-20: Three agents built the cabinets in parallel, each on its own files with the same glossary and tone, and each reported doubts instead of reaching outside its files:
  - settlements and the finance controller;
  - routing, costs and the payments manager;
  - connections, online operations, the pay page and the agents' board.
- 2026-10-20: Their reports and the walk that followed are in the observation. Among the findings:
  - a threshold that could not be lowered;
  - findings that went stale;
  - an empty queue of holds;
  - PSP phrases on the retail pay page.
- 2026-10-20: The on-us hero came after the articles, as the owner ordered. It is drawn from the stand's own terms, and the decision is the routing function's own; a list replaces it on a phone.
- 2026-10-20: `npm run check`, the production build, the access matrix, phone widths and the payer's path all pass.
