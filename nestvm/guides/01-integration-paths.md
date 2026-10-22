# Guide 01 — The ways of bringing NestVM into a system

Status: working guide, 21 October 2026, written from what the laboratory in this directory runs. British English. The machine's own words are used where the machine is meant (knot, bind, controller, membrane, settle — Vol. 15 of the Nest Runtime Specification Set); the portal's words where the portal is meant.

## 1. Three paths, and which one this laboratory takes

| Path | What it is | What it gives | What it costs | Where it stands |
|---|---|---|---|---|
| **A. The machine as a library** | The CoAgnes incubator `learning/coagnes/nestvm/lib` compiled into the host's own distribution and called through its declared contract v1 — the application gate (acts, readings, assemblies, worlds) and the entry gate (`createEngine`, `handleRequest`) | One process; the machine's acts and readings as functions; the document store chosen by the host (memory, files, Firestore); deterministic tests in milliseconds | The library is not a package: it is compiled by path from a sibling checkout, with the host's own `tsc`; its licence travels with it (AGPL for distributed software, behind registration — CoAgnes research preview R6) | **This laboratory** (`src/compose.ts`) |
| **B. The machine as a service** | The engine's own HTTP handler (`lib/entry/handle-request.ts`, wrapped for Cloud Functions / Cloud Run by `lib/entry/function.ts`) with sessions in Firestore (`nestvm-sessions/{session}`: `log/{offset}`, `journal/{offset}`, `state/`, `images/`); the host is a **client** of the three roots — `/service`, `/ingest/{type}?session=`, `/projection/{contract}?session=` | A process boundary and an identity boundary (IAP asserts the actor); the host's code stays Apache-2.0 and links to nothing; native Firestore queries over the log for readers with access | A network hop per gesture; the same in-request discharge limit; the host must still shape facts and route them to sessions | Mounted here under `/machine/*` as a pass-through, so the shape can be seen; not deployed |
| **C. Programmes only** | A machine of one's own, written to the specification (CC BY 4.0) and running the same YAML programmes | Full control of the runtime and its licence; the programmes stay portable (Vol. 09 §9) | Conformance is the host's burden (Vol. 14); the portal's earlier `@river/figure` was *inspired* by the specification and not conformant — a second grammar for one machine is a named non-conformance (Vol. 14 §5) | Not taken here |

The paths are not exclusive. A host may develop against A, run against B, and keep C as the exit a CC BY specification guarantees. What stays the same across them is what makes the choice cheap to revisit: the programmes, the facts, the readings and the door are identical; only the composition root changes.

## 2. What a host owns, and what it may not touch

The contract v1 of the library (`lib/API.md` §1) fixes who may speak to whom. A host composes one `Application` from four things and writes nothing below that line.

1. **The composition root** — the store (`documents`), the programme shelf (`shelf`), the world (`world`) and the assembly record (`assemble`), given once to `createEngine` (`src/compose.ts`). Nothing below the root chooses a place or a world of its own.
2. **The world** — the controllers the host installs. This is the only station a host adds through the contract: a controller claims committed tuples and discharges them to the world (Vol. 07 §2). The laboratory installs two: a **function host** (`src/world/functionHost.ts`) for the pure functions of its catalogue, and the **acquirer's stand-in** (`src/world/acquirerStandIn.ts`). The atelier assembly wraps every installed controller in the hold of the result contract, so a controller cannot publish an answer that breaks the bind's schema (`service.failed` instead).
3. **The programmes** — human-owned YAML on the shelf (`programmes/`), sown into a session at its birth. Everything particular to the domain lives here, never in code: which facts a knot hears, when it is ready, which function a bind asks for, under which schema, what it writes.
4. **The door and the planes** — the host's own: gestures into facts, facts to machines, projections across machines (guide 03).

What a host **cannot** do through v1, and what the laboratory did instead:

- **Register a bind action or a knot strategy.** The catalogue of pure functions a record may name (`publish@1`, `format@1`, `release@1`, `assemble@1`) is closed at the assembly. A pure domain function therefore goes to the **membrane** as a function host — the shape Vol. 10 §9 sanctions for the deterministic class ("the service instruction names the function; the schema fixes its result"). The cost is one `service.request` and one answer on the log per function call, which is also the benefit: every decision is a tuple with its uid, and the journal names the controller and the function version (`by: {controller, function}`).
- **Widen the grammar.** A knot's condition is the null-guard subset (Vol. 05 §4.2); `where` reads a top-level field by strict equality (Vol. 05 §3). Comparisons live in functions; branching is declared `where` rules over the answers' top-level marks — the convention of CoAgnes's own routing case.
- **Defer a discharge.** The settle waits for every controller before the commit (Vol. 08 §3). A world that answers in hours needs a widening the library does not yet have (section 4).

## 3. Deployment shapes

| Shape | Composition | Used for |
|---|---|---|
| **One process, in memory** | `composeMachines({documents: "memory"})` | the walk and the tests: six stories in about a second, byte-identical on every run |
| **One service, files or Firestore** | `composeMachines({documents: "files"})` — the served door; Firestore by the engine's own option | a stand; a pilot's single instance. Each gesture loads the machine at its watermark, settles, commits one atomic movement (log, journal, station documents, images, the command receipt) and discards the machine |
| **Many functions** | the engine's `function.ts` as the machine service; the door as its own function; mirrors fed by Firestore triggers on `log/{offset}` documents (the committed view, by offset) | the target shape of ADR-0025's cut into door, banks, webhooks and a clock — once discharges can wait beyond the request |

In every shape the machine is the same and the programmes are the same. The door is the only place that knows the shape.

## 4. What a pilot needs that the laboratory does not have

1. **A deferred discharge.** A bank's answer arrives later and elsewhere: the challenge page, the webhook, the settlement file. The widening ADR-0025 already built in plain TypeScript — the intention and its outbox entry in one commit, at-least-once delivery with the same idempotency key, a clock that wakes a bank that slept — is what the membrane needs here. It is the neighbour of CoAgnes's open expectation E4 (restart-safe continuation) and should be handed back as a specification widening (Vol. 11 §2), not as code.
2. **Rounds, or sown attempts.** One attempt per machine is honest and cheap. If one machine per order is wanted, each attempt must be a fresh instance of the course sown with new ids and an `emittedBy` stamp — the `deepen` pattern of the Atelier — because an operator bind never reopens (Vol. 06 §4.2).
3. **Identity.** The door stamps the actor from the transport (IAP asserts it; `handleRequest` reads `x-goog-authenticated-user-email`), never from the body. The laboratory has no identity.
4. **Admission for programmes.** The records ingest is a laboratory liberty. A programme a client's team changes should enter through the loader station and the machine's probe, and, when the Cell extension lands (Vol. 12), through admission with a Charter.
5. **The planes in a store.** The fold is the same; the sink is a database and the trigger is the committed log.

## 5. Boundaries that must hold

- **Never copy the library's code into the portal.** Reference it by path (A) or by HTTP (B). The portal's code is Apache-2.0 (ADR-0019); the specification is CC BY 4.0 and attributed in `NOTICE`; the CoAgnes software is AGPL, distributed behind registration. Where the boundary finally stands is the owner's decision, recorded in the ADR as open.
- **Secrets never enter a record or the log** (Vol. 07 §5). An acquirer's adapter resolves its credentials from the environment at assembly; a missing credential is a defect that fails the settle loudly.
- **The door writes only declared, open fact types.** The reserved namespaces (`sys.`, `cell.`, `charter.`, `inference.`, `service.`, `bind.`) are refused at the acts; the door must also refuse a *figure's* type (`risk.Scored`, `route.Chosen` …) from the wire — a comparison nobody made must not be committed as if a function made it. The laboratory's door writes only the person's and the world's types.
- **A fact crosses a machine boundary as content, stamped with its origin** (`represented: {session, offset}`), never as a tuple of another log (guide 03).
