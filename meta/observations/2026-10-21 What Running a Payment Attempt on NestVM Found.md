---
type: observation
date: 2026-10-21
tags: [observation, payments, nestvm, programmes, membrane, laboratory]
---

# What Running a Payment Attempt on NestVM Found

Back to [[00 Meta Home]]. From [[Iteration 08 — NestVM at the Centre]].

**What happened.** The owner's frame of 2026-10-21 — a NestVM machine at the centre of payment processing — was built as a laboratory, `nestvm/`, on the real machine (the CoAgnes incubator, by path), with two programmes, a function host, an acquirer's stand-in, a door, a router and planes. The walk completed every story on the first run; the tests found one defect; the served door was exercised over HTTP and restarted. Each finding below was reproduced before it was recorded or changed.

| # | Found by | What was found | What changed |
|---|---|---|---|
| 1 | Reading the contract | A host cannot register a bind action: the catalogue is closed at the assembly. Pure domain functions have no local seam | They went to the membrane as a function host (Vol. 10 §9); recorded as a candidate widening |
| 2 | Reading `ruleMatches` and `holdResultContract` | A `where` rule reads a top-level field; the result contract validates `data.result`. A controller's answer must satisfy both | The envelope `{bindId, uid, result, by, …marks}` — marks beside the correlation, the convention of CoAgnes's own routing case; recorded for the vocabulary |
| 3 | Writing the programme | No OR-join: a knot cannot be ready on either of two facts, so a function with two doors in is two binds (route; authorisation) | Accepted; counted as a cost; recorded as a candidate widening |
| 4 | The tests | **The capture bind read the card from a scope whose knot had not collected the instrument**; the stand-in saw nothing and captured story six instead of failing it | The knot `authorisation.approved` collects `instrument`; the condition names it |
| 5 | The first build | The library compiles by path with the portal's TypeScript only as CommonJS: its extensionless imports keep Node's type stripping from loading it as sources | `tsconfig.json` with `rootDir: ../..`, CommonJS output, a `package.json` with `"type": "commonjs"` so the root's `"type": "module"` does not override it |
| 6 | The served door | The machine's planes are per session; the door cannot route an attempt to an invoice without a projection across sessions | The planes, folded by offset and rebuilt at every start as the replay check |
| 7 | Reading the settle | Every discharge is answered inside the request; with a bank this cannot hold | Recorded as the widening to hand back (ADR-0025's outbox); the stand-in's record says so |
| 8 | The walk, then five bad programmes on purpose | The first run completed every story; the probe refused nothing because the programme was written in the subset it reads. Fed bad programmes, it refused each in its own words: a duplicate slot, an undeclared name in a condition, a comparison (`amount >= 15` — "this stage supports 'name != null' and 'name == null' joined by '&&'"), an unknown strategy; a flow-style rule is read as a scalar and refused indirectly, as a condition naming an undeclared slot | No change; the words are in the ADR and in guide 04 |

**Lessons**
- **A test that reads the end of the story is worth more than a walk that prints it.** The walk showed story six "settled" and nothing looked wrong until the test said it should have failed. Every story needs the end it must reach, written down before it runs.
- **Completeness is the knot's declaration.** A function at the membrane gets exactly the scope its bind's knot collected; a slot the knot did not declare is a silent default in the function unless the function refuses. Write the knot from the function's needs, and make the function refuse a missing slot where the default would decide money.
- **Put the comparison where it can be read.** A threshold in a knot's condition would be invisible and is not expressible; a threshold in a function's declared record, with the branches as `where` rules, is on the record twice — in the controller's manifest and in the log's marks.
- **Reference, never copy.** The machine compiled by path from a sibling checkout keeps the licence boundary where it is and lets the library move without the portal following it line by line; the two gates of its contract were enough for a whole payment attempt.
- **A replay check at every start is cheap and catches the one thing a mirror can get wrong** — a plane written after a commit that was never made. The served door rebuilds its planes from the stored logs before it listens.
