---
type: iteration
status: review
date: 2026-10-21
tags: [iteration, payments, orchestration, nestvm, programmes, membrane, laboratory]
---

# Iteration 08 — NestVM at the Centre

Back to [[00 Meta Home]]. On the branch `psp`. The decision is `adr/records/ADR-0028 NestVM at the Centre of a Payment Attempt.md`; it follows [[Iteration 07 — Payment Flow Orchestration]] and the chat of 2026-10-20 on how River Pay and NestVM intersect.

## Goal
- **The owner's frame (2026-10-21).** A NestVM machine at the centre of payment processing: the REST API writes facts into machines; many machines; facts routed to instances from shared projections; projections in a persistent store written by the machine's own components; a UI over projections and the API; AI agents as programmes like any other. First approximation: the machine of a payment attempt, which asks an acquiring API through a controller once it has gathered enough; the log as the whole trace.
- Overlay this on the specification and on the CoAgnes implementation; try to run such a machine in a `nestvm/` directory of the portal; supplement it with the architectural and practical ways of integrating NestVM, as an ADR and guides. British English.

## Out of scope
- Changes to the portal's packages, apps, infra or stands.
- A real acquirer, deployment, identity, money.
- The loader and admission; Cells and Charters; agents (named, not built).

## What was built
| Area | Result |
|---|---|
| The machine by path | `nestvm/tsconfig.json` compiles the CoAgnes incubator (`learning/coagnes/nestvm/lib`) and the laboratory's sources into `.dist/` as CommonJS with the portal's `tsc`; only the two gates of the declared contract v1 are imported |
| Programmes | `order` (1 knot, 1 bind) and `payment-attempt` (14 knots, 14 binds) in the incubator's records grammar, with the declared-record disambiguation in their headers |
| The world | a function host over a versioned catalogue (`invoice@1`, `screen@1`, `route@1`, `settle@1`) and the acquirer's stand-in (`authorise@1`, `capture@1`), with declared records under `controllers/` |
| The door and routing | four gestures; the router over the planes; the invoice re-presented across the machine boundary as content stamped with its origin |
| The planes | orders · invoices · attempts · ledger, folded by offset from every log; rebuild and ledger checks |
| The served door | `src/serve.ts` over machines stored as files; the machine's three roots under `/machine/*`; the planes rebuilt and compared at every start |
| The walk and the tests | six stories; five tests, among them byte-identical logs on a second run |
| Records | ADR-0028; `nestvm/README.md`; guides 01–04; `WHITE-PAPER.md` (draft 0.1); this note; [[2026-10-21 What Running a Payment Attempt on NestVM Found]] |

In numbers:
- 30 records in two programmes; 4 catalogue functions; 2 controllers; 13 sessions in the walk (6 orders, 7 attempts).
- An order machine commits 7 tuples; an attempt that ends well 47 (28 records, 4 facts in, 5 requests, 5 answers, 1 readiness per step, 1 receipt); the longest story (review, challenge) 53; the shortest (blocked) 37.
- 223 library files and 15 of the laboratory's compile; no dependency installed; the root `npm run check` untouched (types, topology, 129 tests).

## Definition of done
- [x] A payment attempt runs on the real machine, driven through the declared contract only.
- [x] The six elements of the frame built or named, each with its rule.
- [x] The log of one attempt readable as its whole trace; the planes rebuildable; the ledger balanced; replay identity.
- [x] The served door over stored machines, with the machine's own roots.
- [x] ADR, guides and white paper in British English; the findings recorded.
- [ ] The owner's review of ADR-0028 and of the open decisions (the session's unit; the deferred discharge; the licence boundary).

## Log
- 2026-10-20: The intersection read in chat — the specification (Vol. 00–12, 15), the incubator's `API.md`, the SDK wrapper, the landing's cases, ADR-0025/0026 and the PSP code; seven hypotheses; the owner's framework.
- 2026-10-21: The feasibility compile — the library and the SDK compile from the portal with TypeScript 5.9 as CommonJS, no errors.
- 2026-10-21: The programmes, the catalogue, the two controllers, the composition root, the planes, the router, the door, the walk; the build; the first run completed every story.
- 2026-10-21: The tests found the capture bind reading an instrument its knot had not collected (story six captured instead of failing); fixed in the programme.
- 2026-10-21: The served door exercised over HTTP: an order, an attempt settled in one wave, a refusal, the machine's roots, a restart with the planes rebuilt and identical.
- 2026-10-21: ADR-0028, the README, four guides and the white paper draft; the observation.
