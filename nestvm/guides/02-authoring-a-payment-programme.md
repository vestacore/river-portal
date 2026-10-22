# Guide 02 — Authoring a payment programme

Status: working guide, 21 October 2026, written from `programmes/payment-attempt.yaml` as the machine runs it. British English.

A programme is not a sequence of steps. It is a **figure**: knots that accumulate facts and say when they are ready, binds that wake on readiness and publish, and a world beyond the membrane that answers requests (Vol. 10 §1). A payment attempt is such a figure: it waits until enough is known, judges at declared points, asks the acquirer, and publishes what happened. This guide shows the patterns the attempt is made of, in the grammar the CoAgnes incubator accepts today, and the rules that keep a programme honest.

## 1. The grammar as it stands

A records programme is one YAML document: `programme: <name>`, an optional `description`, and `records`, each of kind `sys.knot.defined` or `sys.descriptor.defined` with the machine's own registration payload (Vol. 04 §2). The file is named as the programme (`payment-attempt.yaml` declares `programme: payment-attempt`). The parser is a deliberate **subset** of YAML (`lib/application/parse-yaml-subset.ts`): block maps and sequences by two-space indentation, plain or quoted scalars, numbers, booleans, `null`; **no flow style** (`[a, b]`, `{a: b}`), no anchors, no multi-line scalars, no multi-document files. A programme needing more is a widening of the subset, recorded, never improvised.

Shapes the machine reads (everything else on a record is the informational level — free keys such as `meta.title` and `meta.gloss` that readings fold and executors ignore):

```yaml
- kind: sys.knot.defined
  payload:
    id: attempt.opened                     # unique in the machine
    strategy: deterministic                # or semantic_evaluator (not used here)
    config:
      wind:
        collect:                           # one or more collection rules (Vol. 05 §3)
          - as: invoice                    # the slot
            match_type: invoice.Issued     # the fact type (the authoring alias `match` is not accepted here)
            reduce: latest                 # latest | append
            # field: text                  # a payload field; absent = the whole data
            # where:                       # discriminators, strict equality on a top-level field
            #   - field: band
            #     equals: pass
        # reset: never                     # on_ready (default) | never
      condition: "invoice != null && terms != null"   # the null-guard subset, && only (Vol. 05 §4.2)

- kind: sys.descriptor.defined
  payload:
    id: attempt.screen
    operator:                              # an operator bind (Vol. 06 §3); omit `demands` when empty
      on: attempt.opened                   # the activation knot
      on_as: attempt                       # the scope name of its understanding (default: activation)
      service:
        instruction: screen@1              # here: the catalogue function the host runs
        schema: { … }                      # the closed JSON Schema subset (Vol. 09 §7) — block style in the file
        emit:
          writes: risk.Scored              # the delegated publication's type

- kind: sys.descriptor.defined
  payload:
    id: review.open                        # an emit descriptor (Vol. 06 §2): the knot's snapshot, verbatim
    subscribesTo: screen.review
    actionConfig:
      writes: review.Opened
```

The machine judges the records at sowing with its own probe (`validateFigure`): an unknown strategy, a condition naming an undeclared slot, two rules with the same `as` in one knot, a duplicate id — each is refused in the machine's words before anything reaches the live session.

## 2. The five patterns of the attempt

### 2.1 The gate — wait until enough is known

```yaml
id: attempt.opened
collect: invoice ← invoice.Issued · terms ← terms.given · session ← session.Opened · instrument ← instrument.Chosen
condition: all four != null
```

A gate detects presence and nothing else (Vol. 10 §2). Four facts, arriving in one wave or in four, complete it; its readiness is reified as `sys.knot.ready` with the four slots as its understanding, and that snapshot is what the bind's scope holds — `scope.attempt.invoice.amountMinor` and so on. **A bind sees only what its knot collected.** The walk found this the hard way: the capture bind read the card's last four digits from a scope whose knot had not collected the instrument, so the stand-in saw nothing and captured. The fix is in the programme, not in the function: the knot `authorisation.approved` now collects `instrument` too.

### 2.2 A function at the membrane, under a schema

```yaml
id: attempt.screen · on: attempt.opened · instruction: screen@1 · emit.writes: risk.Scored
schema: band ∈ {pass, review, block} · score 0..100 · challenge boolean · reasons array — all required
```

A comparison is not a knot's to make, so the threshold lives in a pure function reached at the membrane (`src/catalogue/screen.ts`), and the thresholds themselves live in the terms, which the function reads from the scope (`scope.attempt.terms.screening`). The bind projects a `service.request` carrying the instruction, the scope and the schema — machine-complete (Vol. 06 §4.4); the function host answers under the bind's own emit declaration, and the assembly's hold of the result contract refuses an answer that breaks the schema (`service.failed`, correlated, with the path of the violation). Every such call is two tuples on the log: the request with its uid, the answer with `by: {controller, function: "screen@1"}`.

### 2.3 Declared branching — `where` over the answer's marks

```yaml
id: screen.passed  · collect: screening ← risk.Scored where band equals pass · …
id: screen.review  · collect: screening ← risk.Scored where band equals review
id: screen.blocked · collect: screening ← risk.Scored where band equals block
```

Three knots hear the same answer under three declared rules; exactly one becomes ready. The rule reads a **top-level** field of the fact's data by strict equality (`ruleMatches`, Vol. 05 §3); a function therefore returns, beside its schema-bound `result`, the marks it declares for routing — `band`, `challenge`, `outcome` — and the host writes them at the top level of the answer: `{bindId, uid, result, by, band, challenge}`. This is the convention of CoAgnes's own routing case (the margin band beside the correlation). The "if" is on the record: the comparison in the controller's declared record, the branches as rules anyone can read.

### 2.4 Waiting for a person or the world — the open figure

```yaml
id: review.cleared · collect: cleared ← review.Cleared · screening ← risk.Scored where band equals review · invoice · terms · instrument
id: authentication.passed · collect: passed ← authentication.Passed · route ← route.Chosen · invoice · terms · instrument
```

Where the machine cannot go on alone, it does not wait in code: the wave settles with the knot **open** — its other slots full, one empty — and the machine's own reading says so (`work-queue@1`: the figure `open`, the hearing that was not reached). The door brings the missing fact when the person or the world acts (`POST /attempts/{id}/review`, `/authentication`), and the next wave continues from there. Nothing is polled, nothing is scheduled; the log shows exactly where the attempt stood and for whom it waited. The published `review.Opened` and `authentication.Challenged` are the figure's own words that it waits — what a reviewer's queue or a pay page reads.

### 2.5 The ends — publications, and the mouth

```yaml
authorisation.declined → attempt.Declined   screen.blocked → attempt.Blocked
capture.failed         → attempt.Failed     capture.completed → settle@1 → attempt.Settled
```

Every path ends in a publication: an emit descriptor for the ends nobody computes, the mouth for the one that moves money. `settle@1` checks the capture against the invoice (nothing is settled on a guess — ADR-0025's rule), prices the fee from the route's own answer, and writes balanced postings; the walk's ledger check proves every settled payment sums to zero. The `attempt.Settled` fact is the receipt and the ledger entry at once: the planes read both from it.

## 3. The speakers of a fact type

Each fact type has one speaker and one writer — the PSP catalogue's discipline (ADR-0026), kept here as a table the door enforces at its own gate:

| Speaker | Types | Who writes them |
|---|---|---|
| **the door** (a person, the merchant's system, the clock) | `terms.given`, `order.Created`, `invoice.Issued` (re-presented into an attempt), `session.Opened`, `instrument.Chosen`, `review.Cleared`, `review.Blocked`, `authentication.Passed`, `authentication.Failed` | the door, from a gesture; never a figure |
| **the figure** (a bind, locally) | `review.Opened`, `authentication.Challenged`, `attempt.Declined`, `attempt.Blocked`, `attempt.Failed` | emit descriptors — the knot's snapshot, verbatim |
| **the world** (a controller's answer) | `invoice.Issued` (in the order machine), `risk.Scored`, `route.Chosen`, `authorisation.Answered`, `capture.Answered`, `attempt.Settled`; `service.failed` | the function host and the stand-in, under the bind's emit declaration |

The door must refuse a world's or a figure's type from the wire: a band nobody computed must not enter as if `screen@1` had computed it. The machine refuses the reserved namespaces itself (`service.`, `bind.`, `sys.` …, Vol. 04 §6); the domain's own types are the door's to guard.

## 4. The three obligations, checked for this programme

- **Attribution.** Every fact of an attempt is on the attempt's key (the session); every answer carries the uid of its request and names its author in `by`; a value from another machine carries `represented: {session, offset}`. Two attempts on one invoice never share a key: they are two machines.
- **Reachability.** For each end, the chain input → collect → ready → bind → emit was traced: `attempt.opened` → `screen@1` → one of three bands → (review door) → `route@1` → (challenge door) → `authorise@1` → one of two outcomes → `capture@1` → one of two outcomes → `settle@1`. The walk's six stories exercise every end; the compiler checks reference integrity, not reachability (Vol. 09 §8) — the stories are the check.
- **Termination.** No through-world winding here, so no budgets are needed; every path either publishes an end or leaves one figure open for a door to close. A request no controller claims stays an open intention on the log — visible, never retried in silence (Vol. 08 §7).

## 5. Costs found, and how to change things

- **One function, several doors in.** The route is asked by two binds (`attempt.route`, `attempt.route.cleared`) and the authorisation by two (`attempt.authorise`, `attempt.authorise.authenticated`), because a barrier is `all` and there is no `any`: a knot cannot be ready on *either* of two facts. The duplication is honest and the readings tell the two apart by uid, but an OR-join would halve the records of a real course. A candidate widening, recorded in the ADR.
- **One attempt, one machine.** An operator bind's rendezvous latches once per key (Vol. 06 §4.2). A retry is a new session; the router opens it on the same invoice.
- **To change a policy**, write a new `terms.given` — the functions read the terms from the scope. To change a rule, add `screen@2` to the catalogue and a programme that names it; a version is never edited (ADR-004 d9's catalogue rule). The journal then says which version decided each attempt.
- **Naming.** Fact types follow the portal's catalogue, `aggregate.PastTense`; marks are lower-case words; knot ids read as states (`screen.passed`, `route.frictionless`) and bind ids as acts (`attempt.route`, `review.open`), so a queue reads as a sentence.
