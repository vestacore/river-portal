# TOPOLOGY

How the River Portal code is organised, and the rules that keep it ordered. Decisions: `adr/records/ADR-0002 Package Topology and Gates.md` and `ADR-0003 One Public Function per File.md`. The check runs as `npm run topology`, and `node tools/check-topology.mjs --write` regenerates the diagram and table at the end of this file.

## Shape

```
apps/web            Next.js — one app, two surfaces (public web, IAP studio); the payment river's cabinets under /pay
apps/pay-functions  the payment river's functions: one door or one bank per process (PAY_FUNCTION)
infra               Pulumi (TypeScript) — Google Cloud
packages/
  foundation/       ids, language, privacy, who acts,     (layer 0)
    kernel  i18n  privacy  identity  settings             the settings registry
  record/           the append-only log and storage;      (layer 1)
    store  log                                            streams of facts and the functions
    stream  figure                                        around them (ADR-0025)
  river/            the write side: needs, gifts, flows   (layer 2)
    needs  gifts  flows
  steward/          the organisation's own configuration  (layer 2)
    config
  assist/           AI assistance (Vertex AI)             (layer 2)
    assist
  pay/              the payment river: vocabulary, ledger, (layer 2)
    pay-facts  pay-ledger  pay-flow  pay-acts             the figure, the door, the banks
    pay-providers
  surface/          what is shown: content, reports,      (layer 3)
    content  reports  feed  pages                         feed, page documents;
    pay-views                                             the payment river's views
  compose/          wiring for applications               (layer 4)
    runtime  pay-runtime
tools/              topology checker, version picker, design screenshots, development cards (tools/README.md)
spec/ adr/ meta/    Obsidian vaults: product, decisions, process
```

## Rules

1. **One entry point per package: `gate.ts`.** `package.json` `exports` is `{ ".": "./gate.ts" }`, so deep imports fail to resolve. Other packages import only `@river/<name>`.
2. **Dependencies point down or sideways, never up.** foundation ← record ← river/steward/assist/pay ← surface ← compose ← apps. There are no cycles. Every cross-package import is declared in `package.json`.
3. **One public function per file**, named like the file. Data structures live in `types/`, constant data in `data/`. Tests sit next to the code as `*.test.ts`.
4. **Writes are commands, reads are projections.** A command validates its input, builds event drafts and calls `commit`. `commit` appends the events and runs every registered projector in one transaction. Personal data goes to `private` documents through `privateWrites`, never into events.
5. **Pages read page documents.** Public pages read one or two pre-shaped documents (`public/{org}`, `public/{org}/campaigns/{slug}`, …) that the `surface` projectors keep up to date.
6. **Around a stream, functions come in five kinds** (the payment river, `adr/records/ADR-0025`). An *act* turns a gesture into a draft. A *listener* folds the facts it hears into its own state and says when its need is met. A *joiner* emits drafts once every listener it demands is ready. A *controller* carries an intention to the world and answers with drafts. A *reading* folds a stream into a view. Only `settle` writes — the fragment, the state, the views and the outbox, in one transaction — and only a controller reaches outside.

## Data flow of one request for help

```mermaid
sequenceDiagram
  participant B as Browser (/ask)
  participant A as Server Action (apps/web)
  participant N as @river/needs
  participant L as @river/log commit
  participant S as @river/store (Firestore)
  participant P as projectors (needs, pages, …)
  B->>A: form post (works without JS)
  A->>N: validateNeedInput → submitNeed
  N->>L: drafts need.Submitted, need.Acknowledged + privateWrites
  L->>S: transaction: create events, write private docs
  L->>P: project each event (same transaction)
  P->>S: orgs/{org}/needs/{id}, public/{org} counters
  A-->>B: redirect /track/{token}
```

## Data flow of one payment

One order is one stream. Each arrow into the stream is one wave: one fragment, written in one transaction with the views and the outbox. In the cloud the participants on the right are separate functions; in one process they are calls (`PAY_CARRY=inline`).

```mermaid
sequenceDiagram
  participant M as Merchant cabinet
  participant P as Payer (pay link)
  participant D as Door (ingest)
  participant S as Stream of the order
  participant B as Bank (discharge)
  participant X as Provider
  participant H as Webhook
  M->>D: placeOrder
  D->>S: order.Placed → invoice.Issued
  D-->>M: the pay link, shown once
  P->>D: requestCheckout (the key is the authority)
  D->>S: checkout.Requested → provider.Routed → providerSession.Requested + outbox entry
  S-->>B: the outbox entry is the message (Eventarc)
  B->>X: open a hosted session (idempotency key = stream-seq)
  B->>S: providerSession.Opened
  P->>X: pays on the provider's page
  X->>H: signed webhook
  H->>S: payment.Captured → ledger.Posted → order.Paid → receipt.Issued
  P-->>P: the same link now shows the receipt
```

## Where data lives (Firestore)

| Path | Visibility | Written by |
|---|---|---|
| `orgs/{org}/events/{id}` | per event | `@river/log` commit (append only) |
| `orgs/{org}/needPrivate/{id}`, `giverPrivate/{id}`, `gratitude/{id}`, `tracking/{hash}` | private | command `privateWrites` |
| `orgs/{org}/needs`, `gifts`, `campaigns`, `flows`, `reports`, `feed`, `content` | team | river / surface projectors |
| `public/{org}` (site document), `public/{org}/campaigns/{slug}`, `public/{org}/reports/{id}`, `public/{org}/feed/{id}` | public | surface projectors |

The payment river keeps its own paths — in the cloud, in its own database (`river-pay`), which only its functions may write:

| Path | Holds | Written by |
|---|---|---|
| `orgs/{org}/streams/{orderId}` and `…/log/{seq}` | the head of a stream and its facts (append only, dense) | `settle` |
| `orgs/{org}/streams/{orderId}/figure/state` | the listeners' state and the joiners' latches — a cache of the stream | `settle` |
| `orgs/{org}/streams/{orderId}/acts/{key}` | markers that make an act or a report enter once | `settle` |
| `orgs/{org}/outbox/{bank}/intentions/{orderId}-{seq}` | an intention waiting for its bank; its creation wakes the bank | `settle`, then `discharge` |
| `orgs/{org}/payOrders/{orderId}` | the order view the cabinets read — a fold of the stream | `settle` (the order reading) |

## Packages (generated)

<!-- generated:start (node tools/check-topology.mjs --write) -->
```mermaid
flowchart BT
  subgraph foundation
    i18n["@river/i18n"]
    identity["@river/identity"]
    kernel["@river/kernel"]
    privacy["@river/privacy"]
    settings["@river/settings"]
  end
  subgraph record
    figure["@river/figure"]
    log["@river/log"]
    store["@river/store"]
    stream["@river/stream"]
  end
  subgraph river
    flows["@river/flows"]
    gifts["@river/gifts"]
    needs["@river/needs"]
  end
  subgraph steward
    config["@river/config"]
  end
  subgraph assist
    assist["@river/assist"]
  end
  subgraph pay
    pay_acts["@river/pay-acts"]
    pay_facts["@river/pay-facts"]
    pay_flow["@river/pay-flow"]
    pay_ledger["@river/pay-ledger"]
    pay_providers["@river/pay-providers"]
  end
  subgraph surface
    content["@river/content"]
    feed["@river/feed"]
    pages["@river/pages"]
    pay_views["@river/pay-views"]
    reports["@river/reports"]
  end
  subgraph compose
    pay_runtime["@river/pay-runtime"]
    runtime["@river/runtime"]
  end
  subgraph apps
    web["@river/web"]
    pay_functions["@river/pay-functions"]
  end
  subgraph infra
    infra["@river/infra"]
  end
  assist --> privacy
  pay_runtime --> i18n
  pay_runtime --> pay_acts
  pay_runtime --> pay_providers
  pay_runtime --> pay_views
  runtime --> config
  runtime --> pages
  privacy --> kernel
  privacy --> i18n
  settings --> i18n
  settings --> kernel
  pay_acts --> pay_facts
  pay_acts --> stream
  pay_flow --> figure
  pay_flow --> pay_ledger
  pay_ledger --> pay_facts
  pay_providers --> figure
  pay_providers --> pay_facts
  figure --> stream
  log --> identity
  log --> privacy
  log --> settings
  log --> store
  store --> kernel
  stream --> store
  flows --> needs
  flows --> gifts
  gifts --> log
  needs --> log
  config --> log
  content --> log
  feed --> assist
  feed --> reports
  pages --> feed
  pay_views --> pay_flow
  reports --> content
  reports --> flows
  web --> pay_runtime
  web --> runtime
  pay_functions --> pay_runtime
```

| Package | Layer | Directory | Purpose | Depends on (@river) | External |
|---|---|---|---|---|---|
| `@river/i18n` | foundation (0) | `packages/foundation/i18n` | Locales, formatters and oblast names with Ukrainian grammatical cases. | — | — |
| `@river/identity` | foundation (0) | `packages/foundation/identity` | Roles, identities and signed demo sessions. | — | — |
| `@river/kernel` | foundation (0) | `packages/foundation/kernel` | Identity, time and small primitives shared by every package. | — | — |
| `@river/privacy` | foundation (0) | `packages/foundation/privacy` | Visibility levels, PII redaction and public pseudonymisation. | kernel, i18n | — |
| `@river/settings` | foundation (0) | `packages/foundation/settings` | The settings registry: typed definitions, three profiles, resolution and validation. | i18n, kernel | — |
| `@river/figure` | record (1) | `packages/record/figure` | Functions around the log: listeners that need, joiners that bridge, controllers at the bank, and the wave that settles them. | kernel, store, stream | — |
| `@river/log` | record (1) | `packages/record/log` | Append-only event log: event envelope, commit with projectors. | identity, kernel, privacy, settings, store | — |
| `@river/store` | record (1) | `packages/record/store` | Document store interface with memory and Firestore drivers. | kernel | firebase-admin |
| `@river/stream` | record (1) | `packages/record/stream` | Append-only streams of facts with dense sequence numbers: one stream per key, one fragment per wave. | store | — |
| `@river/flows` | river (2) | `packages/river/flows` | Flows linking gifts to needs: dispatch, costs, delivery, confirmation, gratitude. | kernel, i18n, privacy, store, log, needs, gifts, settings | — |
| `@river/gifts` | river (2) | `packages/river/gifts` | Campaigns, offers and gifts. | i18n, kernel, log, privacy, settings, store | — |
| `@river/needs` | river (2) | `packages/river/needs` | Needs: intake, triage, status and recipient tracking. | i18n, kernel, log, privacy, settings, store | — |
| `@river/config` | steward (2) | `packages/steward/config` | The organisation's stored settings: profile, overrides, commands and projection. | kernel, log, settings, store | — |
| `@river/assist` | assist (2) | `packages/assist/assist` | AI assistance via Vertex AI (Gemini) with an offline extractive fallback. | kernel, i18n, privacy | @google/genai |
| `@river/pay-acts` | pay (2) | `packages/pay/acts` | The door of the payment river: a person's gesture, validated, becomes a fact — and nothing more. | kernel, pay-facts, stream | — |
| `@river/pay-facts` | pay (2) | `packages/pay/facts` | The vocabulary of the payment river: fact types and their payloads, from the order to the mouth. | — | — |
| `@river/pay-flow` | pay (2) | `packages/pay/flow` | The figure of one payment: points of need (listeners) and bridges (joiners) from the order to the mouth. | figure, kernel, pay-facts, pay-ledger, stream | — |
| `@river/pay-ledger` | pay (2) | `packages/pay/ledger` | The law of conservation for the payment river: commission, balanced double entries and account balances. | pay-facts | — |
| `@river/pay-providers` | pay (2) | `packages/pay/providers` | The bank of the payment river: controllers for Stripe and PayPal, their webhooks, and deterministic stand-ins. | figure, pay-facts, stream | — |
| `@river/content` | surface (3) | `packages/surface/content` | Editable site content blocks and safe rich-text rendering. | kernel, i18n, store, log | — |
| `@river/feed` | surface (3) | `packages/surface/feed` | Public feed items composed from reports with AI suggestions and human approval. | assist, content, i18n, kernel, log, privacy, reports, store | — |
| `@river/pages` | surface (3) | `packages/surface/pages` | Page documents (projections) shaped for fast public page rendering. | kernel, i18n, privacy, store, log, needs, gifts, flows, reports, feed, content | — |
| `@river/pay-views` | surface (3) | `packages/surface/pay-views` | The surface of the payment river: the order view folded from its stream, the cabinets' readings, the ledger summary and the river of one order. | figure, kernel, pay-facts, pay-flow, pay-ledger, store, stream | — |
| `@river/reports` | surface (3) | `packages/surface/reports` | Reports generated from flows, edited in the studio, published with consent checks. | content, flows, gifts, i18n, kernel, log, needs, privacy, settings, store | — |
| `@river/pay-runtime` | compose (4) | `packages/compose/pay-runtime` | Wires the payment river for applications and functions: settings from the environment, the doors, the banks, the clock, and the handlers each function runs. | figure, i18n, kernel, pay-acts, pay-facts, pay-flow, pay-providers, pay-views, store, stream | — |
| `@river/runtime` | compose (4) | `packages/compose/runtime` | Wires store driver, projectors and demo seed for applications. | assist, config, content, feed, flows, gifts, i18n, identity, kernel, log, needs, pages, privacy, reports, settings, store | — |
| `@river/web` | apps (5) | `apps/web` |  | config, content, feed, flows, gifts, i18n, identity, kernel, log, needs, pages, pay-facts, pay-runtime, pay-views, privacy, reports, runtime, settings | @tiptap/core, @tiptap/pm, @tiptap/react, @tiptap/starter-kit, next, react, react-dom, tailwindcss, @tailwindcss/postcss, @types/react, @types/react-dom |
| `@river/pay-functions` | apps (5) | `apps/pay-functions` | The functions of the payment river: one door or one bank per process, chosen by PAY_FUNCTION. | pay-runtime | — |
| `@river/infra` | infra (5) | `infra` | Google Cloud infrastructure for River Portal (Pulumi, TypeScript). The owner runs `pulumi up`. | — | @pulumi/pulumi, @pulumi/gcp, @pulumi/command |
<!-- generated:end -->
