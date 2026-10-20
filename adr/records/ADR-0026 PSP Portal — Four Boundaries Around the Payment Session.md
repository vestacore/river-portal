---
type: adr
status: proposed
date: 2026-10-19
tags: [adr, psp, payments, boundaries, hierarchy, agents, ui, i18n]
supersedes:
superseded_by:
spec: spec/01-business/The River Concept.md
---

# ADR-0026 PSP Portal — Four Boundaries Around the Payment Session

Status: **proposed**, on the branch `psp`. The direction is the owner's (2026-10-19): every template of the portal collapses into one PSP portal that is its own showcase and its own demo. The architecture below is proposed for the owner's review.

## Context
- **Before.** `apps/web` carried two products that shared the design language and nothing in the domain: the charity portal (needs, gifts, flows and the studio; ADR-0010, ADR-0020 to ADR-0023) and the payment river's cabinets under `/pay` (ADR-0025). Since 2026-10-02 it had been an open question whether the repository is a charity portal, a kernel with a method, or both.
- **The owner's request**, in substance:
  - Collapse every template into one PSP portal: its own showcase, its own demo stand.
  - **The river is an attempt to pay**: the passage from unpaid to paid.
  - Six traits that set a PSP apart, each to be built, not described:
    1. **Split**: one order, many financial streams, with payment distribution deep in the system.
    2. **A hierarchy of organisational units** in the manner of Active Directory: upper units set rules for, see and steer the flows of the units below.
    3. **Many payment instruments**, each first-class, not only cards.
    4. **The whole cycle of a payment** managed, with its projections in view.
    5. **Agent assistants** — swarms that help people see, track, control and decide.
    6. **Invoicing, order management and tracking**, built in.
  - Two languages, Ukrainian and English; the browser's language is the default.
  - Infographics from the site's own elements — the river and its streams; **bridges are the events on the path where information forms unified projections**.
  - A home page for business with article pages; cabinets for the integrator, the operator, AML and merchant compliance, contracts and access, pay page settings, and a hierarchy administrator with full access.
  - Universal React panels — tables, dashboards with charts, panels of fields — and one way of showing data.
  - Learn from `riverpay/portal_v2` (Flutter) and `riverpay/checkout`; embed the pay page in the demo.
  - A full demo stand and, at the same time, an architecture to assemble modules from: gate modules with clear, documented boundaries based on four entities — **invoice, order, payment and payment session**, "the concrete attempt, which holds the process of its execution; everything else is for assembling the structures that apply here".
- **What the two Flutter projects showed.** The portal: cabinets whose menus are served per profile, sections for transactions, orders, invoices, payouts, reports and settings, tables with filters, a profile switcher. The pay page: the merchant's bar, the invoice and its lines, wallets first, then a list of instruments, a card form that validates as the payer types, modal steps for 3-D Secure, and a result screen. Both shaped what was built here; no code was taken from them.

## Decision

### 1. Words
| Word | Meaning here |
|---|---|
| **River** | One payment session: one attempt to pay one invoice, from unpaid to paid. |
| **Bridge** | A fact of the session's stream. It has a stage and forms the projections the vocabulary names. |
| **Projection** (view) | What a boundary knows of its entity, folded from every fact that names it, whichever stream wrote it. |
| **Stages** | `source → choice → screening → routing → consent → secured → capture → distribution → mouth`. |
| **Delta**, **streams** | The split: one captured amount, many allocations, each to its recipient. |
| **After the mouth** | The payment's own life: refunds, disputes, payouts. |
| **Basin** | The hierarchy: units whose flows run into the unit above. |
| **Swarm** | The agents standing along the river. |

### 2. Four boundaries and one vocabulary
| Boundary | Package | Stream | Holds | Writes — and only it |
|---|---|---|---|---|
| Order | `@river/psp-order` | `ord_…` | lines with their sellers, total, the payer's handle, the split plan, capture mode, fulfilment | `order.*`, `fulfilment.*` |
| Invoice | `@river/psp-invoice` | `inv_…` | the payable claim: amount, due date, hash of the pay key, views, reminders, attempts, receipts | `invoice.*` |
| Payment session | `@river/psp-session` | `ps_…` | one attempt: stage, instrument, risk, review, route, consent, the payment it secured, capture, receipt, how it ended | the river's 39 fact types, `session.Opened` … `session.Succeeded` |
| Payment | `@river/psp-payment` | `pay_…` | money secured by an attempt: capture, the delta, refunds, disputes, payouts | `refund.*`, `dispute.*`, `payout.*` |

- **`@river/psp-facts` is the contract, in data.** Every one of the 57 fact types is listed once, with its owner (the only writer), its stage, its speaker (*door*: a person; *figure*: the machine; *world*: a bank, a carrier, the clock), the projections it forms, whether it ends a session, whether it is released as a webhook (27 are), and its label and meaning in both languages. A compile-time check refuses a payload type that the catalogue does not list.
- **A boundary package** holds its view type, its projector (`hears`, `keyOf`, `project`), its labels and a few pure readers — `invoiceStatusAt` reads *overdue* from the clock instead of storing it; `refundableMinor`; `payoutsDue`. It depends on the vocabulary and nothing else in `psp/`: the topology checker refuses anything more (TOPOLOGY rule 7). Each boundary can therefore be mounted alone.
- **A boundary hears every fact that names its entity**, from any stream. The invoice becomes paid at the session's `capture.Completed`; the order's timeline lists facts of all four streams.
- **The payment is born in the river**: at `authorisation.Approved` or `funds.Received`, the bridge where money is secured. Its own stream begins after the mouth.
- **One writer.** `appendFacts` appends a batch with dense sequence numbers per stream, refuses a fact written into another boundary's stream, projects each fact at once into every view it forms, posts the ledger's entries and releases webhooks. Nothing else writes.

### 3. The structures assembled around them
| Package | Holds | Rules worth naming |
|---|---|---|
| `psp-units` | The hierarchy (platform → entity → partner or holding → merchant → store or seller) and 28 policies in 9 groups | Resolution as in a directory's resultant set of policy: each key combines by `override`, `min`, `max`, `subset` or `union`; a setting is a default or **enforced**; a unit may **block inheritance**; enforced beats a block; the chain says *applied*, *narrowed*, *looser*, *below enforced* or *blocked* |
| `psp-access` | 8 roles, 22 permissions; grants scoped to a unit and its subtree; access requests | Separation of duties: an operator, an access manager or an integrator never also holds compliance over overlapping units; nobody decides their own request |
| `psp-contracts` | Contracts, tariffs, the fee of one payment | A contract's status is read from the clock (`contractStatusAt`); its steps are taken from that status. **A merchant takes payments only under an active contract** |
| `psp-risk` | Scoring with reasons, rules down the tree, AML alerts, onboarding (KYB) cases, name screening | Enforced rules cannot be switched off below; structuring is caught across payments |
| `psp-instruments` | 12 instruments on 9 rails, each with its course of bridges, capabilities, regions, currencies, settlement days and typical fee; acquirers per rail | The pay page and the cabinets read capabilities from this catalogue, so nobody is offered what an instrument cannot do |
| `psp-split` | Plans, templates, allocation, reversal | Allocation always sums to the captured amount; a rolling reserve is carved from the remainder as its own stream; a refund reverses shares in proportion |
| `psp-ledger` | Balanced postings and balances | The ledger is a projection of the split, refunds, lost disputes and payouts — never written by hand |
| `psp-flow` | The pure decisions of an attempt: screening, the route, whether to challenge, the course | No state of its own |
| `psp-checkout` | The pay page's configuration from policies; card checks in the payer's browser; test cards; texts | Only brand, BIN and last four reach the server |
| `psp-integration` | API keys, webhook endpoints and deliveries, the retry schedule, endpoint health, the API log | A webhook is a released fact; its id `evt_{stream}_{seq}` names one fact, so a receiver deduplicates on it |
| `psp-agents` | 8 agents; insights and proposals; consultation | Agents read projections and write insights in their own namespace — never a fact. People decide; the unit's `agents.autonomy` says which low-risk proposals may be carried out alone. A forecast supersedes the last one still open |

Above them: `@river/psp-views` (surface) reads for the cabinets — the river of one session with what each bridge formed, series, funnels, mixes, approvals by acquirer, payout batches. `@river/psp-runtime` (compose) wires the stand: the world in memory, the one writer, stand-in banks, the commands of every cabinet with their access checks, the clock, the swarm, and a history of 75 days replayed through the same commands a live payment uses.

### 4. The app
- **The showcase**: a landing for business drawn from the stand's live figures; six articles (`/platform/split`, `hierarchy`, `instruments`, `lifecycle`, `agents`, `invoicing`); pricing with a fee calculator; developers (the API by example, from real views; webhooks as released facts; the modules); a shop to pay as a customer; the demo's entrance.
- **The pay page**: `/pay/[key]` and `/pay/[key]/track`. The key is the payer's only authority. Wallets first, then the instruments the unit's policies allow; card checks as the payer types; the steps an instrument needs (3-D Secure, a device, a bank's consent, a transfer's details, a kiosk code, a mandate); the split shown where the merchant wants it; an invoice paid in part offers the rest.
- **The cabinets**: one `/cabinet` with 27 sections. A profile is a grant — a role at a unit — and each role has its own menu; a person may hold several profiles and switch between them; a scope picker focuses a subtree. The six cabinets asked for are the roles *integrator*, *operator*, *compliance officer*, *access manager*, *checkout designer* and *hierarchy administrator*; *merchant owner* and *auditor* complete them. Every page checks its actor and permission itself, and every action goes through a runtime command that checks again (as ADR-0025 learnt).

### 5. One way of showing data
- **A grammar of cells.** A column or a field says what a value is — money, a status with its tone, a date, a unit, an instrument, a link, a bar, tags — never how to draw it. `DataTable` (sorting, filters and pages from the address, so it works without JavaScript), `Panel`, `FieldGrid`, `Metric`, `FilterBar`, `FactTimeline`.
- **Charts are plain SVG** in the drafting-table language (ADR-0018): sparkline, line, stacked bars, horizontal bars, and the funnel drawn as the river it is. No chart library was added.
- **Drawings**: the payment river with its bridges and the five squares of the projections each forms; the river of one session; the delta; the basin; the swarm along the banks.

### 6. Languages
`en-GB` and `uk`. The proxy reads `Accept-Language` with its weights (Ukrainian and Russian lead to Ukrainian, English to English, anything else to English); the `river-locale` cookie wins; a path without a locale is redirected. Pages write their texts in place, both languages side by side; the domain's labels live in the packages as localised text. Plurals follow each language's rules.

### 7. What keeps the stand safe
- A card number never leaves the payer's browser; only demo test cards are accepted.
- A pay key and an API key are shown once; only their hashes are kept. Secrets shown once travel in a short-lived `httpOnly` cookie, never in an address.
- Banks, acquirers, the sanctions list and every webhook address (under `.example`) are invented.
- Demo sign-in needs `RIVER_SESSION_SECRET` in a production build; without it there is none.

### 8. What left `apps/web`
The charity portal's routes, studio, editing and components; the `/pay` cabinets of ADR-0025; Tiptap. The packages stay in the repository with their tests (`river/*`, `steward/config`, `surface/content`, `reports`, `feed`, `pages`, `compose/runtime`, `pay/*`, `pay-views`, `pay-runtime`), and `apps/pay-functions` still mounts the payment river. The web app now reads no `RIVER_*` variable except `RIVER_SESSION_SECRET`.

## Consequences
- **Positive**
  - Each of the six traits is a package with tests, not a page.
  - A module is a boundary plus the vocabulary. Another product can mount the order and the invoice without the session, or a new instrument can be one catalogue entry and one course.
  - Replay is the check: replaying the log through the four projectors gives exactly the stored views; the ledger balances in every currency; every split sums to its capture; no high-risk proposal is carried out without a person.
  - The stand is a real river: 75 days, about 47,000 facts, 2,900 orders, 3,000 sessions and 2,500 payments over twelve instruments in 29 units; stories that need a person — a structuring payer, card testing, a transfer that fell short, payouts held before the run, disputes waiting for evidence, a failing webhook endpoint, an onboarding with a sanctions match.
- **Negative / costs**
  - **Three log shapes** now live in the repository: the charity portal's global log with projectors (ADR-0011), the payment river's streams with figures (ADR-0025), and the PSP's streams with one writer in memory. The PSP does not use `@river/figure`'s waves; its figure is plain functions called by commands. Choosing one is a follow-up.
  - **In memory only.** Each server instance has its own world; on a host with several instances (Vercel) a change made in one may not be seen in another. A cold start replays the history (about 2 seconds).
  - **Not deployable to Google Cloud as it stands.** The infrastructure still deploys two surfaces, `web` and an IAP-protected `studio` (ADR-0010); the app now has no IAP identity, only demo sign-in.
  - The charity product is not reachable from `apps/web` on this branch; `main`, the README and the Vercel showcase still describe it.
  - Agents are deterministic analysers standing in for models.
  - Money is simplified: two decimal places for every currency; totals across currencies use one fixed rate for display only; no reconciliation with an acquirer's settlement file beyond the demo's story.
- **Verified**
  - `npm run check`: types, topology (47 packages), 114 tests — 31 of them in the PSP's packages. The production build of the web app passes (45 routes).
  - Every cabinet section requested as eight people in both languages: 200 where the profile may, 404 where it may not.
  - Walks in the browser, with screenshots: the operator, the compliance officer, the access manager (Ukrainian), the integrator, the administrator, the payer; a transfer that fell short taken by an operator, the invoice left partly paid and the pay page offering the rest; every public page and every cabinet section at phone width with no horizontal scroll.
- **Not verified**
  - Nothing was deployed. No real acquirer, bank or lender was called; webhook deliveries are simulated and not signed.
  - Firestore is not used by the PSP. Accessibility has not been audited beyond what the panels give by construction.
- **Follow-ups**
  - A store for the PSP's streams — or move the PSP onto `@river/stream` and `@river/figure` — and an HTTP door for the API.
  - Adapters for real acquirers (sandbox first), signed webhook deliveries, reconciliation with settlement files, currency conversion with recorded rates (ADR-0023).
  - Infrastructure: one surface for the PSP portal, or the cabinets behind IAP with real identities.
  - A decision between the three log shapes; what becomes of the charity portal and of `apps/pay-functions`.

## Alternatives considered
| Option | Why not (now) |
|---|---|
| Keep the charity portal and add PSP pages beside it | Two products in one app was the drift the identity question named; the owner asked for one portal |
| Grow the payment river of ADR-0025 (one stream per order) | One stream would hold the order, its invoice, every attempt and every refund: the four entities the owner named would be facets of one stream, not boundaries. Many attempts per invoice and many payouts per payment fit poorly |
| Boundaries that import each other | Couples the modules; the vocabulary-only rule lets each be mounted alone, and the build proves it |
| A chart library | A dependency (ADR-0007) for what plain SVG does, in the drafting-table language |
| An i18n library | ADR-0017 still holds; texts sit beside each other in place |
| A model behind each agent now | Needs a provider, keys and evaluation; the contract — read projections, write insights, propose — is the same |
| Embedding the Flutter pay page | A second runtime in the demo; the page was made again in React from its structure |

## Related
- ADR-0002 Package Topology and Gates · ADR-0003 One Public Function per File · ADR-0007 Dependency Supply-Chain Policy · ADR-0015 TypeScript Without a Build Step for Packages
- ADR-0017 Own Lightweight Internationalisation · ADR-0018 Drafting-Table Visual Language · ADR-0021 Identity Layer and Demo Personas · ADR-0024 Interim Showcase on Vercel
- ADR-0025 Payment River — Functions Around an Append-Only Stream: its packages stay; its cabinets left `apps/web`
- `TOPOLOGY.md`: the shape, rule 7 and the data flow of one payment session
- `meta/iterations/Iteration 06 — PSP Portal.md`; `meta/observations/2026-10-19 What Walking the PSP Cabinets Found.md`

Back to [[00 ADR Home]].
