# NestVM at the centre of a payment attempt — a laboratory

This directory runs a payment attempt on a **NestVM machine**: the order and the attempt are sessions of the machine, their behaviour is two YAML programmes, every comparison the attempt needs is a pure function at the membrane, the acquirer is a stand-in behind the same membrane, and the whole trace of one attempt is one append-only log that a person can read from the first record to the receipt. A door turns REST gestures into facts and routes them to the right machine; the planes it projects across machines are what a cabinet would read.

It is a laboratory beside the portal, not a workspace package: `npm run check` at the root neither builds nor tests it, and nothing here is deployed. The machine is the CoAgnes incubator of NestVM, `learning/coagnes/nestvm/lib`, taken **by path** and read-only — compiled into this directory's `.dist/`, never copied. The decision and its findings: [ADR-0028](../adr/records/ADR-0028%20NestVM%20at%20the%20Centre%20of%20a%20Payment%20Attempt.md); the guides: [`guides/`](guides/); the thesis: [`WHITE-PAPER.md`](WHITE-PAPER.md).

## The shape

```text
 REST door (src/serve.ts, src/door.ts)            the person's and the world's gestures become facts
   │  routes a fact to a machine (src/router.ts)  by the domain's rule, over the planes
   ▼
 machines — one session each, programmes sown at birth (programmes/*.yaml)
   order machine        order.Created → invoice@1 at the membrane → invoice.Issued
   attempt machine      invoice (re-presented) + session + instrument → screen@1 → route@1
                        → [challenge: the payer] → authorise@1 → capture@1 → settle@1 → attempt.Settled
   │                    [review: a person]   [decline · block · failure: the attempt ends]
   ▼
 the world (src/world/)   the function host — invoice · screen · route · settle (a versioned catalogue)
                          the acquirer's stand-in — authorise · capture (the bank, played by the machine)
   │
   ▼
 the planes (src/planes.ts)   orders · invoices · attempts · ledger — folded from every machine's log,
                              rebuildable from nothing; what a cabinet reads, and what the router consults
```

Inside a machine, the machine's own readings serve (`work-queue@1`, `publications@1`, `trace-film@1` …); the planes exist because those readings are per session and the door must know which machine an invoice lives in.

## Run it

Requirements: the `learning` checkout beside the portal (`../learning/coagnes/nestvm/lib` and its `node_modules`), Node 22, and the portal's own `typescript` (`npm install` at the root). Nothing else is installed.

```bash
cd nestvm && npm run walk
```

The walk runs six stories on machines in memory and prints each machine's log as it was committed — a frictionless payment on the card's own bank; a payment above the challenge threshold, authenticated by the payer; one held for review and cleared by a person; one declined for insufficient funds and retried with another card on a new machine; one blocked by screening; one authorised whose capture the acquirer refused — then the planes, and two checks: the planes rebuilt from the logs are the same planes, and every settled payment's postings balance.

```bash
cd nestvm && npm test
```

Five tests: the stories end where the programme says; the invoice is issued once, by the order machine, with the amount and the due date of the terms; the planes rebuild and the ledger balances; a second run commits **byte-identical logs** (the deterministic class, Vol. 08 §5); the door refuses what the planes do not know and what no machine waits for.

```bash
cd nestvm && npm run serve
```

The door on `http://localhost:8788`, machines stored as files under `.state/sessions/` (one directory per session: `log/`, `journal/`, `state/`, `images/`, `meta.json` — the request cycle without residency). At every start the planes are rebuilt from the stored logs and compared with the planes last written. The roots:

| Root | Does |
|---|---|
| `POST /orders` `{amountMinor, payerRef, currency?, lines?}` | opens an order machine; the invoice comes back from the function host |
| `POST /invoices/{id}/attempts` `{bin, last4}` | opens an attempt machine on the invoice; the wave runs as far as the world lets it |
| `POST /attempts/{id}/authentication` `{outcome}` | the payer's answer to a challenge (`passed` · `failed`) |
| `POST /attempts/{id}/review` `{decision, actor}` | a reviewer's decision (`clear` · `block`) |
| `GET /planes`, `/planes/{orders\|invoices\|attempts\|ledger}` | the projections across machines |
| `GET /machines`, `/machines/{id}/log`, `/machines/{id}/queue` | one machine's committed log and its figures with their stages |
| `/machine/service/…`, `/machine/ingest/{type}?session=`, `/machine/projection/{contract}?session=` | the machine's own three roots, passed through |

The stand-in's story is told in the data and nowhere else: a card ending `0051` is declined (insufficient funds), `0005` is declined (do not honour), `0091` is authorised but not captured; any other card is approved and captured. Only a BIN and the last four digits ever reach the door.

## Map

```text
assembly/terms.json          the terms the machines work under — acquirers and their rates, issuers by BIN,
                             screening thresholds, the routing strategy; written into every machine as terms.given
programmes/order.yaml        the order machine — 1 knot, 1 bind
programmes/payment-attempt.yaml   the attempt machine — 14 knots, 14 binds
controllers/*.yaml           the declared records of the two controllers (Vol. 07 §5)
src/compose.ts               the composition root: store, shelf, world, assembly — chosen once
src/catalogue/               invoice@1 · screen@1 · route@1 · settle@1 — pure, versioned, immutable by version
src/world/                   the function host and the acquirer's stand-in
src/door.ts · src/router.ts  gestures into facts; which machine a fact belongs to
src/planes.ts                the projections across machines, rebuildable by offset
src/walk.ts · src/walk.test.ts · src/serve.ts
guides/                      how to integrate, author, route and read
WHITE-PAPER.md               the thesis, with this directory as its evidence
```

## What this does not do

- **One attempt per machine.** An operator bind fires once per key (Vol. 06 §4.2); a retry is a new machine on the same invoice, which the router opens. The alternative — one machine per order with each attempt sown as a fresh instance of the course — is recorded in the ADR, not built.
- **The world answers inside the request.** The library settles every discharge before it commits; a real acquirer (3-D Secure, webhooks, a transfer that takes days) needs a deferred discharge the library does not yet offer. The stand-in is honest about this in its record.
- **Programmes are sown through the records ingest**, the laboratory liberty of the CoAgnes API. The paradigm's path — the loader station, admission — is not exercised here.
- No identity, no secrets, no money, no deployment. The planes live in one JSON file; a cabinet would read them from a store fed by the same fold.
