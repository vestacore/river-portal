# Guide 03 — The door, the routing of facts and the planes

Status: working guide, 21 October 2026, written from `src/door.ts`, `src/router.ts`, `src/planes.ts` and `src/serve.ts`. British English.

The owner's frame (20–21 October 2026) decomposes a payment system into six elements. This guide says where each stands in the laboratory and what rule holds it there.

| Element | In the laboratory | The rule |
|---|---|---|
| **Machines** | one session per order, one per attempt; a programme sown at birth; the world answers through the membrane | a machine knows nothing outside its log; everything it needs is a fact on its lane |
| **REST API** | `src/serve.ts` → `src/door.ts`: four gestures | a gesture is shaped into facts and validated as a courtesy; the machine decides inside the wave |
| **Routing of facts** | `src/router.ts`, over the planes | names the session and the programme; refuses an id the planes do not know; never writes |
| **Projections in a store** | `src/planes.ts`: orders · invoices · attempts · ledger, folded from every log | a pure fold by (session, offset); rebuildable from nothing; never a second truth |
| **UI** | not built; what it would read is the planes plus the machine's own readings | reads projections and commits only through the door |
| **AI agents** | not built; the shape is a programme like any other (section 6) | hears released facts, writes its own namespace, proposes; people decide through the door |

## 1. The door

A gesture becomes facts on one machine's lane, in one wave:

| Gesture | Facts written | On the machine |
|---|---|---|
| place an order | `terms.given`, `order.Created` | a new order machine (the order's id) |
| open an attempt on an invoice | `terms.given`, `invoice.Issued` (re-presented), `session.Opened`, `instrument.Chosen` | a new attempt machine (the attempt's id) |
| answer a challenge | `authentication.Passed` · `authentication.Failed` | the attempt machine that waits for a challenge |
| decide a review | `review.Cleared` · `review.Blocked` | the attempt machine that waits for a review |

What the door validates is a courtesy that keeps hopeless gestures out of the log: ids are plain (`^[a-z0-9][a-z0-9-]*$`), amounts are positive integers of minor units, the payer is a handle (never a name or an address), only the BIN and the last four digits of a card reach it. What the door never does is decide: whether an attempt may be routed, authorised or settled is the programme's, judged inside the wave on the log as it stands at that moment. A stale plane cannot make the door wrong — at worst the router refuses a gesture the machine would have refused in its own words.

Two further things the door owns:

- **The terms.** The assembly's policies (`assembly/terms.json`: acquirers and their rates, issuers by BIN, screening thresholds, the routing strategy, the approval floor) are written into every machine at its birth as `terms.given`. A policy is a fact the programme reads, not a setting the code remembers; a change of policy is a new fact, and a replay under old terms gives the old decisions.
- **The clock.** The machine has none; every fact the door writes carries the moment it was given (`at`). The walk fixes the clock so that its logs are byte-identical on every run.

A gesture returns a receipt (`upToOffset`) and the row of the planes it changed. Read-your-writes: a reading at or beyond `upToOffset` sees the gesture's whole wave.

## 2. Routing a fact to a machine

The router is a pure function of the planes and the gesture. It answers with a session and a programme, or with a refusal.

| Gesture | Route |
|---|---|
| an order | `{session: orderId, programme: "order", fresh: true}` |
| an attempt on an invoice | the invoice must be known and not paid; `{session: attemptId, programme: "payment-attempt", fresh: true, context: {invoice: {session, offset}}}` |
| a challenge answer, a review decision | the attempt must exist and must wait for exactly that (`waits: "challenge" | "review"`); `{session: attemptId, fresh: false}` |

Three rules follow from the machine:

1. **A fact belongs to one lane.** Inside a machine a bind publishes on its activation's key and a controller answers on its request's key (Vol. 06 §2, Vol. 03 §5); nothing changes lane. So an attempt cannot be "a key inside the order's session" — it is a session of its own, and the router is where that decision is made explicit.
2. **A fact crosses a machine boundary as content, stamped with its origin.** The attempt machine needs the invoice; the router finds it in the planes and the door writes it as `invoice.Issued` with `represented: {session, offset}` — the value as it is, and the address it was read from (the Atelier's re-presentation move, rail 4). A tuple of one log is never copied into another.
3. **Fan-out is a list.** A gesture that several machines must hear would return several sessions and the door would write to each; the laboratory has no such gesture, but the shape is the same.

The planes are the routing table. Where they live (a JSON file here, a database in a pilot) is the door's concern; what they hold is the fold of section 3.

## 3. The planes

A plane is folded from committed tuples by one pure function, `foldTuple(planes, session, tuple)`:

| Fact | Effect on the planes |
|---|---|
| `order.Created` | an order row: `created` |
| `invoice.Issued` (the function host's answer, in the order machine) | an invoice row: `issued`, with the session and offset it was read from; the order becomes `invoiced` |
| `invoice.Issued` (re-presented, in an attempt) | the attempt learns its invoice; no new invoice row |
| `session.Opened`, `instrument.Chosen` | an attempt row: `opened`; the invoice lists the attempt |
| `risk.Scored`, `review.Opened`, `route.Chosen`, `authentication.Challenged`, `authorisation.Answered`, `capture.Answered` | the attempt's stage, its band, its acquirer and expected fee, what it waits for |
| `attempt.Settled` | the attempt `settled` with its fee; postings into the ledger; the invoice `paid` by this attempt; the order `paid` |
| `attempt.Declined`, `attempt.Blocked`, `attempt.Failed`, `service.failed` | the attempt's end, with the reason the world gave |

Mirroring is **by offset**: each session's next unmirrored offset is kept, so folding a log twice changes nothing, and the planes can be dropped and rebuilt from every stored log — the check that runs in the tests and at every start of the served door ("planes rebuilt from N stored sessions: identical to the planes last written"). This is the mirror function of an observer (CoAgnes `nestvm/mirrors/publication-mirror.md`): it reads committed tuples only, answers nothing, and lag is a permissible state. In a pilot the same fold runs from a trigger on the machine's `log/{offset}` documents into a database; the per-session projections the machine itself keeps (`images/`) are the other half, read through its readings.

The planes are not a second truth. Where a plane and a log disagree, the log stands and the plane is rebuilt.

## 4. What a cabinet would read

- **Where things stand:** the planes (`/planes/attempts` — stage, waits, acquirer, fee, reason).
- **Why:** the machine's readings for one session, under `/machine/projection/…?session=`: `work-queue@1` (every figure with its stage — `waiting`, `open`, `published`, `closed` — and, for an open one, which hearing was not reached), `publications@1` (the released history), `figure-history@1` (one figure's dossier: what reached each knot, each intention and its answer), `trace-film@1` (the film), `tuple-trace@1?at=` (one tuple's cause and consequences), `station-trace@1` (the journal by station and by controller).
- **The receipt and the ledger:** `attempt.Settled` on the log, or the ledger plane.

A cabinet commits only through the door. It never writes a fact of its own, and it never reads the log for product logic — the readings are the contract (`lib/API.md` §4).

## 5. The same door over the machine as a service

Everything above holds unchanged when the machine is a service (guide 01, path B): the door calls `/ingest/facts?session=` and `/ingest/records?session=` instead of the acts, and the planes are fed by triggers on the committed log instead of a read after each commit. The laboratory mounts the machine's own roots under `/machine/*` so that the two can be compared on one process.

## 6. Agents as programmes

An agent is a session with a programme: its knots hear the facts it cares about (released from the payment machines and re-presented into its lane as content), and its binds publish **insights and proposals in a namespace of their own** (`insight.*`, `proposal.*`), never a fact of the payment's vocabulary — the PSP's rule of ADR-0026 kept where the machine can enforce it (the door refuses the payment types from any lane but the payment's). A person accepts or refuses through the door, and the decision is a fact on the record. Installing a model's controller at that assembly makes the agent semantic (Vol. 08 §5) without changing its programme; the payment machines stay deterministic because no model answers inside their settle. The Charter → Cell → assessment → review line of Vol. 12 is the governed form of the same shape, when it lands. None of this is built here; it is named so that the frame's sixth element has its place.
