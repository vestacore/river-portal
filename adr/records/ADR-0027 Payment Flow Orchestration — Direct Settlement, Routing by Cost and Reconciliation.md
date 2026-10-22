---
type: adr
status: proposed
date: 2026-10-20
tags: [adr, payments, orchestration, routing, on-us, reconciliation, retail, agents]
supersedes:
superseded_by:
spec: spec/01-business/The River Concept.md
---

# ADR-0027 Payment Flow Orchestration — Direct Settlement, Routing by Cost and Reconciliation

Status: **proposed**, on the branch `psp`. The frame is the owner's (2026-10-20); the architecture below is proposed for the owner's review. It builds on ADR-0026 and keeps everything that ADR built.

## Context
- **The owner's reframing**, in substance:
  - The system is a **payment flow orchestration platform, with automation by agents**: software assembled for a client's needs. A PSP is a finished process; it becomes one assembly of the platform.
  - The **first client in view is a large retail group in Ukraine**: a chain of supermarkets. It already has acquiring agreements with several banks, its own accounts, an order system, a bonus system and an accounting system (ERP).
  - **Not** POS terminals, and **not** replacing the client's internal systems: the platform glues them to payment instruments and orchestrations.
  - Look carefully at **on-us** and **interchange** optimisation, and at taking away the PSP's charges for things a large client does not need.
  - Do not make the existing functionality shallower, even where this client does not need it; take away the PSP positioning; add what such a client cannot do without.
  - The frame is a guide, not a fence.
- **The owner's decisions on the proposal** (same day):
  - The bonus system usually exists already: the demo needs an integration with it, not a bonus system.
  - Reconciliation: yes, in a basic, universal form.
  - Treasury with forecasts: **no** — that is the ERP's.
  - Two new articles, "Routing and cost" and reconciliation; routing on the home page with the emphasis on optimisation, on-us and cost; calm, industrial, descriptive terminology without slogans, professional and accessible; then **one hero of on-us routing**; then review every cabinet's demo from the frame.
- **What the market facts say** (checked for the proposal):
  - Domestic interchange of Ukrainian consumer cards is capped at 1.2 % since 26 November 2021; corporate and foreign cards are outside the cap.
  - The National Bank's instant credit transfers (SEP 4.1) run since 1 December 2024: within ten seconds, up to 100,000 hryvnias.
  - Open banking rules apply from 1 August 2025; banks' interfaces were expected to open widely in 2026.
  - Technical operators of payment services register in the National Bank's Register of payment infrastructure.
  - Online is a small share of a grocery chain's turnover; most card money is taken at the tills, through the banks' own terminals.

## Decision

### 1. One platform, two assemblies
- The demo runs **two stands** of the same packages side by side, each a world in memory with 75 days of history:
  - `retail` — an invented retail group whose banks settle to it directly;
  - `psp` — the PSP of ADR-0026, which holds its merchants' money.
- A person's id prefix selects the world (`r-…`, `p-…`). A pay key is looked up in both. The home page, the articles and most cabinets speak about the retail assembly first; the PSP assembly keeps every function it had.
- Nothing that serves only the PSP was removed: split by template, payouts, rolling reserves, onboarding and AML, tariffs. Where the retail group does not need a function, its menus and labels leave it out — the function itself stays.

### 2. Direct settlement as a policy
- `settlement.model: direct` is a policy, enforced at the group. The acquirer settles to the merchant's account and keeps its own fee.
- The split plan's fee share is the acquirer's (role `acquirer_fee`, recipient `acq:<acquirer>`). The ledger reads clearing with each acquirer, the acquirer's fees, and what is payable to each unit.
- Refunds and lost disputes are netted by the bank in a later batch; the platform pays nothing out and keeps no reserve.
- In the PSP assembly nothing changes: `custodial` is the default.

### 3. A fifth boundary: the settlement batch
- `@river/psp-settlement` owns `sales.Reported` (the merchant's own record), `settlement.Reported` (the provider's report, with lines by issuing bank, scheme, card product and on-us), `settlement.Credited` (the bank credit) and `settlement.Resolved` (a person's decision).
- One stream per batch: provider, unit and business day. The package forms the batch's view and reconciles a batch three ways (`reconcileBatch`), with a tolerance of one hryvnia or a kopiyka per payment.
- Statuses, most urgent first: not reported, not credited, credit differs, fee differs, amount differs, resolved, awaiting report or credit, matched.
- What a batch should hold comes from the platform's own payments where it carried them, and otherwise from the merchant's sales record. The expected fee is priced from the acquiring terms, line by line.
- TOPOLOGY rule 7 now names five boundaries; the checker enforces it.

### 4. Acquiring terms and the cost of a payment
- `AcquiringTerms` per acquirer, merchant and channel (online or at the till):
  - a blended rate, or Interchange++ (interchange and scheme fees at cost plus the acquirer's markup);
  - a fixed part;
  - an optional on-us rate for the bank's own cards.
- `acquiringCostOf` prices one card payment by part, in integer kopiykas. The demo's interchange figures are stated assumptions under the cap, not published rates.
- A directory of invented issuers by BIN (`issuers`, `issuerOfBin`, `cardProfileOf`) says whose card it is, its scheme and product, and which acquirers are the issuer's own.

### 5. Routing by approval and cost
- `chooseRoute` quotes every acquirer the stand is connected with under the merchant's terms and applies the unit's strategy (`routing.strategy`):
  - `approval_first`: the earlier weights by approval;
  - `least_cost`: the lowest expected fee;
  - `on_us_first`: the card's own bank where the terms price it on-us, otherwise least cost.
- An approval threshold (`routing.minApproval.bps`) keeps cost optimisation from choosing an acquirer with a lower approval rate. The platform's floor is 80 %; the group sets its own above it (90 % in the demo); units below may only raise it.
- `route.Chosen` records the strategy, the issuer, on-us, the expected fee and every alternative with its approval rate and eligibility.
- `simulateRouting` replays real sessions under each strategy and threshold. It uses the same function on the same quotes: a replay, not a model.
- **The tills are outside routing.** `posOutlook` reads the banks' in-store reports — never payments the platform carried — and prices each region's card turnover under every bank's terminal terms and under an on-us clause. `pos.acquirer` records which bank's terminals a region uses.

### 6. The retail group's flows
- **Capture after picking.** The card is authorised for the estimated basket. The order system reports picking (`fulfilment.Picked` with the picked lines and the changes: weight, missing, substitute). The invoice is adjusted (`invoice.Adjusted`). The capture takes the picked amount less bonus points, and the rest of the hold is released (`capture.Completed` with `releasedMinor`). An instrument that cannot hold money pays first and is refunded the difference (`picked_less`).
- **Bonus points through the client's bonus system.** Bonus points are an instrument on the `loyalty` rail, carried by a connector to the merchant's own bonus system. The pay page shows the balance; points are reserved, redeemed as part of the order and returned on a refund; if the card part fails, the points are given back. The bonus system reports a daily batch like a bank.
- **Payment at the door** by QR or card after picking, and **corporate invoices** on terms by bank transfer, with reminders by policy.
- **Connections** to the group's order system, bonus system, ERP and BI: keys and webhook endpoints, health, and what each exchanges. The platform replaces none of them.

### 7. Agents for the frame
- The **Navigator** replays routing and proposes `change_policy` (a strategy, a region's terminal bank) or `negotiate_terms` (an on-us clause; a bank whose approval keeps its own cards off on-us).
- The **Reconciler** proposes `raise_claim`, grouping fee differences by provider, and `investigate_break` per batch.
- Findings of a standing condition belong to a **series**: a newer one supersedes the open one, and one no longer found is closed as no longer current.
- Accepting a proposal still needs the right the proposal would use: `routing.write`, `costs.read`, `reconciliation.write`.
- In direct settlement the Sentinel opens an alert instead of holding payouts.
- The **Treasurer** is not enabled for the retail group (`agents.enabled`): cash planning belongs to its ERP.

### 8. Roles
- Two roles are added:
  - the **payments manager**: routing, costs, agreements;
  - the **finance controller**: settlements, reconciliation, costs, the ledger, disputes.
- New permissions: `routing.write`, `costs.read`, `reconciliation.write`.
- The retail group has nine demo people. Its menus put routing, costs, reconciliation and connections first, and its labels call acquiring terms what the PSP calls tariffs.

### 9. The surface
- **The home page** describes the platform in calm terms. Its hero is the on-us routing drawing (`OnUsRouting`, fed by `routeExample`): one card payment, priced by part at each acquirer under the stand's own terms, and the decision of the platform's own routing function under the strategy and threshold in force. Live figures show the change of strategy in the stand's history.
- **Eight articles**:
  - two new: "Routing and the cost of acceptance" and "Settlement reconciliation";
  - six rewritten with the retail group's figures: the life of a payment, instruments, structure and policies, orders and invoices, distribution of a payment, agents.
- **"What a payment costs"** replaces the tariff page: one payment priced at each acquirer under the group's agreements, how the platform is paid for (as software, not as a percentage of payments), what lowers the cost, and the PSP assembly's tariffs.
- **The cabinets**:
  - a routing studio: policy, replay with a chosen threshold, on-us kept away by the threshold, the tills by region;
  - costs;
  - settlements and reconciliation, with a batch page and a person's resolution;
  - connections;
  - overviews for the two new roles;
  - the routing decision on a session's page, the cost on a payment's page, picking and capture on an order's page, hold, capture and release on the payer's tracking page.

### 10. What is not built, by decision
- Treasury forecasting: the ERP's.
- Processing store payments.
- Replacing the order, bonus or accounting systems.
- SSO and SCIM with the client's directory: named as a deployment matter.
- The path of the full card number to the chosen acquirer: a PCI DSS decision before a pilot.

## Consequences
- **Positive**
  - The core of ADR-0026 carried over almost whole. The change is a policy (direct settlement), a fifth boundary, a cost model, routing v2 and a second stand, not a rewrite.
  - Every cost figure is computed by one function (`acquiringCostOf`): the route quote, the replay, the fee audit, the till outlook and the calculator on the public page.
  - Routing decisions are explainable after the fact: each records its alternatives, and any policy can be replayed on real sessions.
  - The demo shows the commercial lever where the money is — the tills — without the platform processing them.
- **Negative / costs**
  - Two worlds in memory: a cold start replays both (about three seconds for the retail stand).
  - The demo's online volume is small. Sums are small; the rates carry over, and the articles say so.
  - Issuers, BIN ranges, interchange figures, terms and approval rates are invented. Real ones come from the schemes' tables, the acquirers' IC++ files and the client's agreements.
  - The PSP and the retail stand share labels in places; where a label is the PSP's, the retail menus hide the section rather than rename the function.
- **Verified** (2026-10-20; details in `Iteration 07 — Payment Flow Orchestration`)
  - `npm run check`: types, topology (48 packages), 129 tests. The production build passes (49 routes).
  - Every cabinet section requested as the group's nine people and the PSP's six: 200 where the profile may, 404 where it may not, no error page.
  - Every site page and every section of the group's administrator at 375 px without horizontal scroll.
  - The payer's and the operator's path in the browser, from a shop order to the capture after picking and the payer's tracking page.
- **Not verified**
  - Nothing deployed. No real acquirer, bonus system, order system or ERP was called.
  - Settlement files are generated by the stand, not parsed from a bank's format.
- **Follow-ups**
  - The PCI DSS path for on-us routing: the platform's own payment fields, a neutral token vault or network tokens; portable tokens for saved cards.
  - The legal qualification of the platform in each assembly: software on the merchant's side, or a technical operator in the National Bank's register.
  - Parsers for the acquirers' settlement and IC++ files; real BIN tables.
  - Cascading to another acquirer on a soft decline; failover when an acquirer is down; A/B shares of traffic.
  - Omnichannel refunds (an online purchase returned in a store, to the original card and acquirer).
  - Pay by bank through open banking as interfaces open; SEP instant transfers by QR at delivery with a real bank.
  - Postings to the client's ERP in its format; a store for the streams (ADR-0026's follow-up still stands).

## Alternatives considered
| Option | Why not (now) |
|---|---|
| Keep the PSP positioning and add a retail merchant to it | A PSP holds the money and charges a share of it; the client neither needs nor wants that. The platform's core does not depend on holding money, so holding it became a policy |
| Replace the PSP stand with the retail one | The owner asked not to make the existing functionality shallower. A marketplace, franchisees or a client's own PSP use the same core |
| One world with both holdings | Different settlement models, people and stories in one log make every reading filter by assembly; two worlds keep each stand's story whole |
| Route store payments too | That is POS processing, which the owner ruled out. The banks' reports give the commercial lever without it |
| Build treasury forecasting | The owner ruled it out: the ERP's. The platform gives it reconciled facts |
| A model for the routing economist now | The replay is exact on real history and needs no provider; a model would take the same contract later |

## Related
- ADR-0026 PSP Portal — Four Boundaries Around the Payment Session: everything it built stays. The PSP becomes one assembly, and its boundaries became five.
- ADR-0002 Package Topology and Gates · ADR-0003 One Public Function per File · ADR-0017 Own Lightweight Internationalisation · ADR-0018 Drafting-Table Visual Language
- `TOPOLOGY.md`: rule 7 (five boundaries) and the data flow of a settlement batch
- `meta/iterations/Iteration 07 — Payment Flow Orchestration.md`; `meta/observations/2026-10-20 What Reframing the PSP as Orchestration Found.md`

Back to [[00 ADR Home]].
