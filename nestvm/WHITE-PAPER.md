# A payment attempt as a wave-log machine

Draft 0.1 · 21 October 2026 · River Portal, branch `psp` · the laboratory in this directory is the evidence for every claim below; nothing is claimed beyond what it runs.

## Abstract

A payment is not a procedure. It is a set of facts that arrive from different parties at different times — the merchant's claim, the payer's choice, a screening, a route, the bank's word, the money — and a set of points at which enough is known to go on. A machine whose only memory is an append-only log of such facts, whose units wait for readiness and publish what they decided, and whose only contact with the world is a membrane that turns intentions into answers, runs a payment natively: the trace of the attempt *is* the process, readable from the first record to the receipt, replayable, and honest about where it waits. This paper states that claim in the terms of the Nest Runtime Specification Set, shows it running on the CoAgnes incubator of NestVM for a retail payment attempt — order, invoice, screening, routing by cost with on-us, authentication, authorisation, capture, settlement — and names what the specification and the library still lack for a pilot.

## 1. The claim

The Nest runtime (Vol. 01 §1) accumulates and integrates understanding: facts are committed to one log; **activation knots** wind matching facts into accumulated state and test readiness; **bind descriptors** wake on readiness, gather a bound scope, judge it and publish; **output controllers** on the membrane discharge intentions to the world and return its answers as facts. A wave settles when the log stops growing and nothing is in flight.

Read with a payment in mind, each station has a name the industry already uses:

| Nest runtime | A payment attempt |
|---|---|
| a fact on the log | the order, the invoice, the payer's instrument, a screening, a route, the bank's answer, the capture, the receipt |
| a knot's readiness | "enough is known to screen", "to route", "to ask the acquirer", "to settle" |
| a bind's judgement and publication | the decision at that point, written as a fact with its reasons |
| the membrane and a controller | the acquirer, the 3-D Secure server, a pure function that compares, a person who reviews |
| an open figure at quiescence | the attempt waiting for the payer's authentication, for a reviewer, for the bank |
| the log | the whole trace of the attempt, in one place |

Three consequences follow, and they are what an orchestration platform for a large merchant needs. **The programme is data**: the course of an attempt is declared records, sown into a machine, versioned, replaceable per client without a fork of the code. **Every decision is attributable**: a route, a score, a fee is an answer on the log with the uid of the request that asked for it, the controller that answered and the version of the function — the journal an auditor asks for, by construction. **Incompleteness is honest**: an attempt that waits is a figure with one slot empty, visible in the machine's own readings, never a timer in a service.

## 2. What runs

Two programmes on the CoAgnes incubator (`learning/coagnes/nestvm/lib`, contract v1), compiled by path into the portal's laboratory and driven through the library's declared acts and readings:

- the **order machine** — one knot, one bind: the merchant's order and the assembly's terms are gathered; a pure function at the membrane, `invoice@1`, issues the invoice as a delegated publication;
- the **attempt machine** — fourteen knots, fourteen binds: the invoice (re-presented from the order machine), the session, the instrument and the terms open the attempt; `screen@1` scores it and declares a band and whether a challenge is due; three declared rules branch on the band; a reviewer's decision or the payer's authentication enters through the door where the programme waits; `route@1` prices every connected acquirer by part under the strategy in force — on-us first, least cost, highest approval — and records every alternative; the acquirer's stand-in authorises and captures; `settle@1` checks the capture against the invoice and writes balanced postings.

The world is two controllers: a **function host** for a versioned catalogue of pure functions, and the **acquirer's stand-in**, the bank played by the machine under the acquirer's own name, its story told by the card's last four digits and nowhere else. The machine class is deterministic — no AI, no bank — and the same programmes run unchanged when a real acquirer's adapter is installed in the stand-in's place.

Six stories run in about a second: a frictionless payment on the card's own bank (fee at the on-us rate); a payment above the challenge threshold, authenticated by the payer; one held for review and cleared by a person; one declined for insufficient funds and retried with another card on a new machine; one blocked by screening; one authorised whose capture the acquirer refused. An attempt that ends well is forty-seven tuples including its twenty-eight records: four facts in, five requests across the membrane, five answers back, one receipt. Five tests hold: the stories end where the programme says; the invoice is issued once with the terms' due date; the planes the door projects across machines are rebuilt from the logs and are the same planes; every settled payment balances; **a second run commits byte-identical logs**.

Around the machines, the laboratory builds the four elements a system needs and the machine does not provide: a **door** that turns gestures into facts and validates as a courtesy without deciding; a **router** that names which machine a fact belongs to, from the projections; **planes** — orders, invoices, attempts, the ledger — folded from every machine's log by offset, idempotent and rebuildable; and the machine's own readings for the questions a cabinet asks about one attempt. A served door keeps the machines as files, one directory per session, and rebuilds the planes at every start as its own replay check.

## 3. What it shows about orchestration

- **Routing by cost, explained after the fact.** `route.Chosen` carries the strategy, the issuer, whether the route is on-us, the expected fee and every alternative with its price and eligibility. A replay under other terms is a new `terms.given`, not a new deployment.
- **Policies as facts.** The terms are written into every machine at its birth. A rule that changes is a new version in a catalogue, named in a new programme; the old version stays, and the journal says which one decided each attempt.
- **Where the person decides.** A review is a fact a person commits through the door; the machine waits with the figure open and continues from there. Nothing in the code decides for the reviewer.
- **Reconciliation is native.** A bank's settlement line and the platform's own capture are two facts arriving independently; a knot that waits for both is the barrier, and an unmatched line is an open figure — the exception queue is a reading, not a system. Not built here; the shape is the one the attempt already uses.
- **Agents are programmes.** An agent is a session whose knots hear released facts and whose binds publish insights in a namespace of their own; a model is a controller installed at that assembly; people decide through the door. The payment machines stay deterministic because no model answers inside their settle.

## 4. What it does not yet show

- **A deferred discharge.** The library settles every discharge before it commits; a real acquirer answers later and elsewhere (the challenge page, the webhook, the settlement file). The outbox the portal built in plain TypeScript in ADR-0025 — intention and outbox entry in one commit, at-least-once delivery with the same idempotency key, a clock that wakes a bank that slept — is the widening the membrane needs, and it should be handed back to the specification (Vol. 11 §2), not kept as code.
- **One attempt per machine.** An operator bind fires once per key; a retry is a new machine. One machine per order with attempts sown as fresh instances is the alternative, not built.
- **An OR-join.** A barrier is `all`; a knot cannot be ready on either of two facts, so a function entered through two doors is two binds. Honest, and twice the records.
- **Admission, identity, money.** Programmes are sown through the laboratory's records ingest; the loader and the Cell extension's admission are not exercised. No identity, no secrets, no acquirer, no deployment.

## 5. Relation to earlier work

The portal's payment river (ADR-0025) re-expressed these ideas as plain TypeScript functions around per-order streams and built the membrane's missing half — the outbox. The PSP and the orchestration platform (ADR-0026, ADR-0027) built the vocabulary, the boundaries, the cost model and the routing as code in memory. This laboratory puts the machine itself at the centre and shows that the course of an attempt is a programme, that the pure decisions are a catalogue, and that the log is the trace. Which of the three shapes the platform takes — code around streams, a machine with programmes, or a machine as a service — is the decision ADR-0028 records as open, with this directory as the evidence on the machine's side.

Of the specification, the laboratory exercises Volumes 02–08 as CURRENT behaviour — the envelope and the engine, the topology and readiness, the deterministic knot, both descriptor forms, the membrane's sweep and the hold of the result contract, the settle loop — and the records subset of Volume 09; nothing of Volume 12. The specification is CC BY 4.0 and attributed in the portal's `NOTICE`; the library is CoAgnes's, read-only, by path.

## 6. Open questions

1. What is a session for a retailer with its own acquiring: the attempt, as here, or the order with sown attempts?
2. Which form does the deferred discharge take in the specification — a membrane widening, a session-layer widening (E4), or both?
3. Where does the catalogue of a client's rules live, and who may append a version: the assembly's code, a programme, or a Cell under a Charter?
4. Which readings does a cabinet need that neither the planes nor the per-session readings give — the cross-machine open figures (every attempt that waits, for whom, since when)?
