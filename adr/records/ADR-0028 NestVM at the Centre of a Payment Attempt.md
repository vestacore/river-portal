---
type: adr
status: proposed
date: 2026-10-21
tags: [adr, payments, orchestration, nestvm, programmes, membrane, laboratory]
supersedes:
superseded_by:
spec: none
---

# ADR-0028 NestVM at the Centre of a Payment Attempt

Status: **proposed**, on the branch `psp`. A laboratory, `nestvm/`, built on 2026-10-21 from the owner's frame of the same day; nothing in the portal's packages or apps changes. The architecture below is proposed for the owner's review; the open decisions are named as open.

## Context
- **Where the question comes from.** On 2026-10-20 the owner asked how the portal's payment work (ADR-0025, ADR-0026, ADR-0027) and NestVM intersect. The answer in chat: one geometry in two dialects — the payment river had mapped its parts onto the specification's stations, the PSP had dropped the wave and runs an imperative course in memory; the difference that matters is where the programme lives (code, or records on the log) and how the world is reached (an outbox beyond the request, or a discharge inside it). Seven hypotheses were put forward; the one tested here is that an attempt to pay is a programme of the machine, with the attempt as the session.
- **The owner's frame (2026-10-21).** A NestVM machine stands at the centre of payment processing. When the REST API creates an order, it writes a fact into a machine; an invoice, a fact; and so on. There are many machines; which instance a fact is written to is decided from projections that every instance writes into shared planes, by the domain's own logic. The system then decomposes into: running NestVM instances that execute their YAML programmes, consuming facts and reaching the world through the membrane; a REST API; the routing of facts; projections in a persistent store, written by the machine's own components; a UI that works only with projections and the API; and AI agents that are NestVM programmes like any other. In the first approximation, a programme that has gathered what it needs with the needed completeness asks an acquiring API through a controller — the machine of a payment attempt. There are no separate services for order, invoice and payment; they are structural interactions inside the machine's logic, and may or may not exist — a `payment_request` may enter directly, or an order may cascade into one. The machine's append log is then the complete trace of the attempt: in one place, visualisable, verifiable, documented at the level of the specification.
- **Constraints.** `learning/coagnes` is read-only for the portal; its code is not copied (AGPL; the specification is CC BY 4.0). The PSP's two stands keep everything they have. Nothing is deployed. British English for every document.
- **What the library offers today** (checked in code on 2026-10-20 and 2026-10-21): the declared contract v1 (`lib/API.md`) — acts, readings, three assemblies, worlds, the composition root and the HTTP handler; the request cycle without residency over memory, files or Firestore; deterministic knots with the null-guard condition and `where` by strict equality on a top-level field; emit descriptors and operator binds with a one-shot latch; local bind actions from a closed catalogue; controllers installed through the hold of the result contract; the settle that waits for every discharge inside the request.

## Decision

### 1. A laboratory beside the portal
- `nestvm/` is a directory at the root, outside the npm workspaces and outside the topology checker: `npm run check` neither builds nor tests it. It has its own `package.json` (`"type": "commonjs"`), `tsconfig.json`, scripts (`walk`, `test`, `serve`) and ignored `.dist/` and `.state/`.
- The machine is **taken by path**: the CoAgnes incubator's TypeScript (`../learning/coagnes/nestvm/lib`: core, machine, session, application, side, entry) is compiled by the portal's own `tsc` into `nestvm/.dist/` as CommonJS, beside the laboratory's sources. Nothing is copied into the repository. The laboratory imports only the two gates of the declared contract — `lib/application/gate` and `lib/entry/gate` — and derives the few types the gates do not name from what they export; it never reaches into `lib/core`.

### 2. The elements of the frame, and where each stands
| Element | Built as | File |
|---|---|---|
| Machines | one session per order, one per attempt; a programme sown at the session's birth through the records ingest; the world answers through the membrane | `src/compose.ts` |
| Programmes | `order` (1 knot, 1 bind) and `payment-attempt` (14 knots, 14 binds), human-owned YAML in the incubator's records grammar | `programmes/` |
| The world | a **function host** for a versioned catalogue of pure functions (`invoice@1`, `screen@1`, `route@1`, `settle@1`) and the **acquirer's stand-in** (`authorise@1`, `capture@1`); declared records for both | `src/world/`, `src/catalogue/`, `controllers/` |
| The REST API | a door of four gestures (place an order; open an attempt on an invoice; answer a challenge; decide a review) over machines stored as files; the machine's own three roots mounted under `/machine/*` | `src/serve.ts`, `src/door.ts` |
| Routing of facts | a pure function of the planes and the gesture: the session, the programme, and whether it is fresh; refusals for ids the planes do not know and for what no machine waits for | `src/router.ts` |
| Projections | the planes — orders, invoices, attempts, ledger — folded from every machine's committed log by offset; rebuildable from nothing; persisted to one JSON file | `src/planes.ts` |
| UI | not built; named: reads the planes and the machine's readings, commits only through the door | guide 03 |
| Agents | not built; named: a programme like any other, in its own namespace, a model as a controller at that assembly | guide 03 §6 |

### 3. The attempt as a programme
- **One attempt is one machine.** An operator bind fires once per key (Vol. 06 §4.2); a second attempt on the same invoice is a new session the router opens, with the invoice re-presented from the order machine's publication as content stamped `represented: {session, offset}`. The alternative — one machine per order with each attempt sown as a fresh instance of the course, after the Atelier's `deepen` — is recorded, not built.
- **The order may cascade, or the invoice may enter directly.** The order machine issues the invoice through `invoice@1`; the attempt machine takes an `invoice.Issued` from the door. Both are the same fact type with two speakers; the programme does not care which.
- **Every comparison is a pure function at the membrane** (Vol. 10 §9) and every branch is a declared `where` rule over the answer's top-level marks (`band`, `challenge`, `outcome`), the convention of CoAgnes's own routing case. The thresholds, the acquirers' rates, the issuers and the strategy are the terms, written into every machine at its birth as `terms.given`: a policy is a fact the programme reads.
- **Where a person or the world must act, the machine waits with an open figure** — a reviewer's decision, the payer's authentication — and the door brings the fact; nothing polls.
- **The mouth** checks the capture against the invoice and writes balanced postings; money is conserved by construction.
- **The speakers** of each fact type are fixed (door · figure · world) and the door guards them: it writes only the person's and the world's types, never a figure's.

### 4. What the laboratory leaves out, by decision
- The loader station and admission (programmes enter through the laboratory liberty of the records ingest).
- Identity, secrets, a real acquirer, a store for the planes, deployment, money.
- Agents, Cells and Charters: named, not built.

## Findings — what running it found
1. **The contract has no seam for a host's bind actions.** The catalogue a record may name (`publish@1`, `format@1`, `release@1`, `assemble@1`) is closed at the assembly; a host cannot register a pure function as a local action. So the domain's pure functions go to the membrane as a function host — sanctioned by Vol. 10 §9 — at the cost of two tuples per call, which is also the benefit: every decision is a request with a uid and an answer naming the controller and the function version. A registry lent to the assembly would be a small widening of the contract, worth handing back.
2. **`where` reads a top-level field only** (`ruleMatches`), while a controller's delegated publication nests its content in `result` and the hold of the result contract validates exactly that `result`. The answer envelope that satisfies both is `{bindId, uid, result, by, …marks}` — the marks at the top level beside the correlation. The convention is CoAgnes's own; it should be written into the vocabulary of the specification (Vol. 11 §4.7) so that two implementations agree on it.
3. **A barrier is `all`; there is no `any`.** A function entered through two doors (the route after screening and after review; the authorisation with and without a challenge) is two binds. Honest, and twice the records of a real course. An OR-join is a candidate widening.
4. **A bind sees only what its knot collected.** The capture bind read the card from a scope whose knot had not collected the instrument; the stand-in saw nothing and captured. Found by the test, fixed in the programme. "The intention is machine-complete" (Vol. 06 §4.4) cuts both ways: completeness is the knot's declaration, and a missing hearing is a silent default in the world's function unless the function refuses.
5. **The discharge is inside the request.** With stand-ins the whole attempt settles in one wave — four facts in, forty-seven tuples out. With a bank it cannot: the challenge page, the webhook and the settlement file answer later and elsewhere. ADR-0025's outbox is the widening the membrane needs (the neighbour of CoAgnes's expectation E4); it should be handed back as a specification widening (Vol. 11 §2), not kept as the portal's code.
6. **The library compiles by path** with the portal's TypeScript 5.9 (223 files, no errors) once emitted as CommonJS; its extensionless imports keep Node's type stripping (ADR-0015) from loading it as sources. The boundary is clean: two gates, no core imports, the laboratory's own types derived from the gates.
7. **The machine's probe refuses in its own words** at sowing, before anything reaches the live session (checked on five bad programmes): a duplicate slot ("Duplicate collection slot 'a' on knot 'k'"), an undeclared name in a condition, a comparison ("Unsupported condition atom 'amount >= 15'; this stage supports 'name != null' and 'name == null' joined by '&&'"), an unknown strategy; a flow-style rule (`{ as: a, … }`) is read by the subset as a scalar and refused indirectly, as a condition naming a slot nobody declared. The laboratory needed no validator of its own.
8. **Per-session readings need a plane beside them.** The machine's readings answer every question about one attempt and none across attempts; the door needs the planes to route and a cabinet needs them to list. The fold is a mirror by offset and is rebuildable — the check runs in the tests and at every start of the served door.
9. **The deterministic class holds end to end**: six stories, thirteen sessions, byte-identical logs on a second run.

## Consequences
- **Positive**
  - The frame of 2026-10-21 runs: machines with programmes as data, a door, routing by the planes, projections rebuildable from the logs, the world behind the membrane — and the log of one attempt is its whole trace.
  - The decisions of an attempt are explainable by construction: a route carries its strategy, its issuer, whether it is on-us, its expected fee and every alternative; the journal names the function version that decided.
  - The same programmes run unchanged when a real acquirer's adapter replaces the stand-in, and when the machine runs as a service instead of a library (the door speaks the same facts).
  - The portal stays Apache-2.0 and copies nothing: the library is referenced by path, the specification is attributed.
- **Negative / costs**
  - Two trees compile together; the laboratory depends on a sibling checkout and on the incubator's current shape (its contract v1 is declared, not released).
  - One attempt per machine; two binds where one function has two doors in; programmes sown through a laboratory liberty.
  - The planes live in one JSON file; nothing is deployed; no identity.
  - Licence: Apache-2.0 code linking to an AGPL library is an open decision for the owner (the owner's earlier lean: the portal's payment work inside the CoAgnes structure under AGPL; the commerce briefs' lean: Apache-2.0 core with sold programmes). This ADR decides nothing about it.
- **Verified** (2026-10-21)
  - `cd nestvm && npm test`: five tests — the stories' ends; the invoice issued once with the terms' due date; the planes rebuilt and the ledger balanced; byte-identical logs on a second run; the door's refusals.
  - `npm run walk`: six stories, the planes, both checks.
  - The served door over files: an order, an attempt to `settled` in one wave, a refusal, the machine's roots under `/machine/*`, a restart with the planes rebuilt from two stored sessions and found identical.
  - `npm run check` at the root is untouched by the directory.
- **Not verified**
  - No real acquirer, no bank sandbox, no webhook, no deployment, no identity. The Firestore store of the library was not exercised here (CoAgnes's own tests cover it).
- **Follow-ups**
  - The deferred discharge as a specification widening, with ADR-0025's outbox as the running evidence (H4).
  - The session's unit for a retailer: attempt (here) or order with sown attempts (H2).
  - A lent action registry, the marks convention and an OR-join as candidate widenings for the bridge's manifest.
  - The PSP stands' courses (`courseFor`, twelve instruments) as programmes; `chooseRoute`, `screenAttempt`, `acquiringCostOf` as catalogue versions.
  - A reconciliation programme: the settlement line and the capture as a barrier; the open figure as the exception queue.
  - An agent as a programme on a released stream, deterministic first, then with a model's controller.
  - The licence boundary, decided by the owner.

## Alternatives considered
| Option | Why not (now) |
|---|---|
| A machine of the portal's own from the CC BY specification (as `@river/figure` was, extended) | Conformance is the portal's burden and `@river/figure` was inspired, not conformant; the question was whether the real machine carries a payment, and that is answered only by running it |
| The developer wrapper `@coagnes/sdk-nestvm` (`coagnes/sdk/nestvm`) | Resident, in memory, browser-oriented, with no programme shelf; the laboratory needed the document mode, the shelf and the machine's own HTTP roots — the contract v1 directly |
| Copying the library into `packages/` | Never: the code is AGPL and the repository is Apache-2.0; by path and read-only, or over HTTP as a service |
| Keep `driveSession` and add a trace | It would not test the claim; the course would stay code, and the comparison between the two shapes is the point |
| One machine per order with attempts as keys | A fact never changes lane inside a machine (Vol. 06 §2, Vol. 03 §5): the invoice on the order's key would not hear an attempt's capture; sown instances are the real alternative, recorded above |

## Related
- ADR-0025 Payment River — Functions Around an Append-Only Stream: the mapping onto the specification and the outbox this ADR asks to hand back.
- ADR-0026 PSP Portal, ADR-0027 Payment Flow Orchestration: the vocabulary, the boundaries, the cost model and the routing the catalogue functions follow.
- ADR-0015 TypeScript Without a Build Step for Packages: why the laboratory compiles instead; ADR-0019 Licensing and Open Publication.
- `nestvm/README.md`, `nestvm/guides/01–04`, `nestvm/WHITE-PAPER.md`; `meta/iterations/Iteration 08 — NestVM at the Centre.md`; `meta/observations/2026-10-21 What Running a Payment Attempt on NestVM Found.md`.
- The Nest Runtime Specification Set (CC BY 4.0, attributed in `NOTICE`): Vol. 02–08 CURRENT, Vol. 09 records subset, Vol. 10 §9, Vol. 11 §2–§4; the CoAgnes incubator's `nestvm/lib/API.md` (contract v1).

Back to [[00 ADR Home]].
