# Guide 04 — Running the machines and reading what they committed

Status: working guide, 21 October 2026. British English.

## 1. Building

`npm run build` in `nestvm/` runs the portal's own `tsc` (`../node_modules/.bin/tsc`, TypeScript 5.9) over three trees — the CoAgnes library by path (`../../learning/coagnes/nestvm/lib`: core, machine, session, application, side, and the entry files except the Cloud Functions adapter), the laboratory's `src/`, and nothing else — into `.dist/`, as CommonJS. Why CommonJS: the library's relative imports carry no extensions, so Node's own type stripping cannot load them; compiled to CommonJS they resolve. `rootDir` is `../..`, so the output keeps the two trees apart: `.dist/learning/coagnes/…` and `.dist/portal/nestvm/src/…`. The directory's `package.json` says `"type": "commonjs"`, which the root's `"type": "module"` would otherwise override. `.dist/` and `.state/` are ignored by git.

The build needs the `learning` checkout beside the portal with its `node_modules` (the library's lazy cloud imports resolve their types there) and the portal's `node_modules` (`typescript`, `@types/node`). Nothing is installed for the laboratory itself.

## 2. Running

| Command | What runs | Where state goes |
|---|---|---|
| `npm run walk` | six stories on machines in memory; prints every log, the planes, the two checks | nowhere |
| `npm test` | the five tests of `src/walk.test.ts` (`node --test`) | nowhere |
| `npm run serve` | the door on `PORT` (default 8788) over machines stored as files | `.state/sessions/<session>/…` and `.state/planes.json` |

To start afresh, remove `.state/`. A served door started over an existing `.state/` rebuilds the planes from the stored logs first and says whether they match the planes last written.

## 3. Reading a log

The walk prints each machine's log as the machine committed it, one line per tuple, leaving out the registration records (offsets 0–1 of an order machine, 0–27 of an attempt machine). The columns: the offset, the kind or fact type, and who gave it.

```text
#28 terms.given            ← the door
#29 invoice.Issued         ← re-presented
#30 session.Opened         ← the door
#31 instrument.Chosen      ← the door
#32 sys.knot.ready         attempt.opened
#33 service.request        → the membrane
#34 risk.Scored            ← screen@1 [band=pass challenge=false]
#35 sys.knot.ready         screen.passed
#36 service.request        → the membrane
#37 route.Chosen           ← route@1 [challenge=false]
#38 sys.knot.ready         route.frictionless
#39 service.request        → the membrane
#40 authorisation.Answered ← controller.acquirer.stand-in [outcome=approved]
…
#46 attempt.Settled        ← settle@1
```

- `← the door` — a fact the door wrote from a gesture (the person, the merchant's system, the clock).
- `← re-presented` — a value brought from another machine by its address.
- `sys.knot.ready <knot>` — the knot's readiness, reified, with its slots as the snapshot (Vol. 02 §5.2).
- `→ the membrane` — a bind's intention, machine-complete, swept by the membrane.
- `← <function>` or `← <controller>` — the world's answer under the bind's emit declaration, with the marks the next rules read in brackets.
- `← <knot>` on a figure's own type — an emit descriptor's publication (`triggeredBy`).
- `service.failed: …` — the world refused, or an answer broke its contract; the reason follows.

Every attempt that ends well is the same shape: four facts in, five requests out, five answers back, one receipt — forty-seven tuples including the twenty-eight records, in one wave when the world answers inline. An attempt that waits ends its first wave at an open figure and continues when the door brings the fact.

## 4. The machine's readings

Over the served door, under `/machine/projection/<contract>?session=<id>`:

| Contract | Says |
|---|---|
| `work-queue@1` | every figure (a bind with the knots it hears) and its stage — `waiting` (nothing reached it), `open` (some hearings reached, one not), `published`, `closed` (the one projection spent); what each hearing heard and from whom |
| `publications@1` | the released history: every publication with the uid of the intention that released it |
| `figure-history@1?bind=<id>` | one figure's dossier: the facts that reached each knot, the readiness snapshots, each intention with its terminal answer |
| `trace-film@1` | the film of the run, frame by frame, with the registers that moved |
| `tuple-trace@1?at=<offset>` | one tuple: what caused it, what it produced, which tuples share its stamps |
| `station-trace@1?controller=<id>` | what a controller was handed, what it answered, its defects |
| `vitals` | the watermark, the counts, the machine class, the continuation |

The laboratory's own shortcuts: `/machines/{id}/log` (the whole committed log) and `/machines/{id}/queue` (the work queue).

## 5. The checks, and adding a story

- **Replay identity** (`walk.test.ts`, test 4): the stories run twice; every session's log is compared as JSON — byte-identical, because nothing in the machine, the functions or the stand-in is random or reads a clock, and the door's clock is fixed. A real acquirer breaks this by design (the semantic class's rule: replay is reading, re-execution may differ, Vol. 08 §5).
- **The planes rebuild** (test 3; the served door at start): `rebuildPlanes` folds every stored log from nothing and must equal the planes the door kept.
- **The ledger balances** (test 3): every settled payment's postings sum to zero.

To add a story, add its gestures to `runStories` in `src/walk.ts` with fixed times, and the end it must reach to test 1. A story that ends somewhere unexpected is a finding, not a failure to hide: the log says where it stood.

## 6. When something refuses

| Symptom | Meaning | Where to look |
|---|---|---|
| `assemble rejected by the machine's probe — …` | the programme's records are not acceptable: "Duplicate collection slot 'a' on knot 'k'"; "Condition references unknown name 'b'; declared names: a"; "Unsupported condition atom 'amount >= 15'; this stage supports 'name != null' and 'name == null' joined by '&&'"; "Unknown strategy: rules_engine". A flow-style rule (`- { as: a, … }`) is read by the subset as a scalar, so the knot declares no slot and the condition's name is "unknown" — write the rule in block style | the message quotes the rule; fix the programme |
| an attempt stays at a stage with no end and no `waits` | a request nobody claims: an instruction that is not in the catalogue, or a controller that was not installed | `/machines/{id}/queue` shows the figure `published` with its intention open; the log shows the `service.request` with no answer |
| `service.failed` with a reason | a function threw (a missing slot in scope, a capture that does not match the invoice), or an answer broke the bind's schema (the reason names the path) | the log; then the programme — most often a knot that did not collect what the function needed |
| `attempt '…' does not wait for a review` | the router: the machine's planes say the attempt is elsewhere | `/planes/attempts` |
| `the planes know no invoice '…'` | the attempt names an invoice no order machine issued | place the order first; or the planes were not mirrored — restart the served door |
