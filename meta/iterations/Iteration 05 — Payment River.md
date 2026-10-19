---
type: iteration
status: review
date: 2026-10-02
tags: [iteration, payments, log, functions, experiment]
---

# Iteration 05 — Payment River

Back to [[00 Meta Home]]. An experiment on the branch `new-approach`; the decision is `adr/records/ADR-0025 Payment River — Functions Around an Append-Only Stream.md`.

## Goal
- **The owner's question.** The river is a geometry: two banks, a stream, a mouth, tolls, sediment, a surface. A payment platform inherits the same geometry and only renames it. Build a minimal payment orchestrator that shows this, where a seller can find a payer and the payer can give and receive in a safe environment.
- **The frame.**
  - `order` as a request, `invoice` as the key, `checkout` as the gate to the mouth.
  - TypeScript functions with clear layers, built around a log in the manner of the Nest Runtime Specification Set.
  - The minimal flow: a payment with a commission, routed to one of the connected providers (Stripe, PayPal).
  - An operator's UI, a merchant's cabinet, a payer's cabinet.
  - Run as Google Cloud Functions connected by messaging; all settings in `infra/`.
- **The question asked along the way.** "One order — one append-log fragment?" Answer: one order is one *stream*; each wave in it is one *fragment*.

## Out of scope
Refunds, disputes, payouts, reconciliation; accounts for merchants and payers; a merchant API with keys; anything that moves real money. Each is listed as a follow-up in ADR-0025.

## What was built
| Area | Result |
|---|---|
| Kernel | `@river/stream` (append-only streams, dense numbering, three kinds of origin) and `@river/figure` (listeners, joiners, controllers, readings; a pure `runWave`; `settle` as the only writer; `discharge` with a stable idempotency key, safe under overlapping deliveries, giving up only where nothing can have happened; `foldStream` as the replay oracle). Neither knows about payments |
| Payment domain | `@river/pay-facts` (21 fact types), `@river/pay-ledger` (commission, balanced entries), `@river/pay-flow` (6 listeners, 6 joiners, routing as a pure rule, one fold for attempts shared by the gate, the cancellation and the view), `@river/pay-acts` (the door), `@river/pay-providers` (Stripe and PayPal over `fetch`, webhook checks, stand-ins) |
| Surface | `@river/pay-views`: the order view, the cabinets' reads, the ledger summary, the river of one order |
| Wiring | `@river/pay-runtime`: settings from the environment with refusals for unsafe shapes; the doors as messages; provider reports; the clock (expiry, abandoned pages, waking a bank); the handler of each function; the replay check; a demo seeded through the real doors |
| Functions | `apps/pay-functions`: one HTTP skin, the function chosen by `PAY_FUNCTION`; `Dockerfile.pay` |
| Cabinets | Fourteen routes under `/pay` in `apps/web`, in British English and Ukrainian: the way in; the merchant's cabinet and order page; the payer's cabinet; the invoice (by link or signed in); the stand-in provider's page; the operator's orders, order stream, ledger, routes and outbox |
| Infrastructure | `infra/src/createPayRiver.ts` and four small files: a database of its own, six services, per-function identities and secrets, Eventarc triggers from the outbox, a scheduler for the clock. Off unless `payEnabled` |
| Records | ADR-0025; `TOPOLOGY.md` (shape, rule 6, the data flow of one payment, where its data lives); `NOTICE` (attribution of the Nest Runtime Specification Set); README |

In numbers: 9 packages and one app added, 240 source files, about 6,100 lines of code and 1,240 of tests; 57 new tests (83 in all). No external dependency was added.

## Definition of done
- [x] The line and every branch are facts in a stream, and each has a test.
- [x] The same code runs as one process and as separate functions; the cut is tested with the messaging played by the test.
- [x] The three cabinets can be walked in the browser, in both languages.
- [x] `npm run check` passes; the production build passes.
- [x] Two independent reviews; every finding acted on was reproduced first.
- [ ] `pulumi preview` and `pulumi up` — the owner's step.
- [ ] A payment through Stripe's test mode and PayPal's sandbox — needs the owner's test keys.

## Log
- 2026-10-01: Kernel first, with a toy river (a wish, a gift, a delivery) as its only test subject, so that the kernel could not learn anything about payments. Seven tests: the barrier, exactly-once discharge, rounds, failure as a fact, caches equal to a fold, independent streams, a runaway wave refused.
- 2026-10-01: The figure of one payment as pure functions, tested with no store and no provider. Then the door and the banks.
- 2026-10-01: Reasoning about webhooks before writing the cabinets found a defect the tests had not: the gate counted failures per *event*, so the same failure reported twice would have closed the gate for ever. It now closes the *attempt* a failure names. See [[2026-10-02 What Building the Payment River Found]].
- 2026-10-01: The payer's handle may not contain `@`: an e-mail address is personal data and the handle enters the stream.
- 2026-10-02: The runtime, then a test that cuts the river into functions: six runtimes over one store, each holding only its own secret, the test delivering outbox documents as Eventarc would. A bank function without the right credentials refuses before an attempt is counted.
- 2026-10-02: The cabinets, walked in the browser as each role: an order placed, the link opened, a declined attempt at the first provider, a second attempt carried by the other, the receipt at the same link; a withdrawal by the merchant and by the operator; expiry by the clock; the auditor's read-only view; phone width; Ukrainian. The walk found four things the tests could not; see the observation.
- 2026-10-02: Infrastructure written against the provider's type definitions and the Eventarc documentation; type-checked only. The image's install stage and start command were rehearsed outside Docker: 220 packages, no Next.js or React, the door answering over HTTP.
- 2026-10-02: **First review** (cabinets, functions, infrastructure). Two findings were serious and both reproduced at once: the operator's pages were authorised only in their layout, so an anonymous request got a redirect with the orders in its body; and the return address given to providers redirected to the container's bind address in the production server. Also: a database id one character too short, a stand-in's page reachable by anyone who knew an order's id, stand-ins as a default outside Cloud Run. All fixed; each has a check.
- 2026-10-02: **Second review** (kernel and domain), with scenarios that ran. It found what the tests had not asked: a PayPal capture reported as pending — or simply unanswered — was recorded as failed, and the payer sent to pay again; an order could be withdrawn while its capture was on its way; an abandoned PayPal page held an order for ever; a delivery that failed late reopened an intention another delivery had answered. These were faults of the model, not slips, and were fixed in the model: the outcome of a capture is never guessed; a cancellation is a request decided inside the wave; nothing unasked ends an attempt whose money is being asked for; the clock closes pages nobody completed; the outbox entry is changed only inside a transaction. The reviewer's scenarios were run again afterwards.
- 2026-10-02: The cabinets walked again after the rework: a declined attempt, a second provider, approval and capture, a withdrawal, the clock.
- 2026-10-02: `npm audit` reports one critical advisory in `next` 16.3.5, fixed in 16.3.6 and later. It predates this iteration and the app does not use the affected feature (`next/og`), but the rule of ADR-0007 now asks for the move, on `main` first. Left for the owner as a separate task.

## What is not verified
Said plainly, because a payment system is judged by what was actually run:
- **Nothing was deployed.** The Pulumi program has not been previewed or applied.
- **No request has reached Stripe or PayPal.** The adapters were tested against scripted responses.
- **Firestore itself was not exercised** by the new code; the store interface was (memory driver), and the Firestore driver is the portal's existing one. The Firestore emulator is not installed here; with it, the same test suite could be pointed at real transaction semantics.
- **Concurrency was reasoned about and probed, not proved.** The reviewer's fuzz over a store that mimics optimistic transactions found no forked stream; it is not part of the suite.

## What to look at first
1. `http://localhost:3000/en-gb/pay` — act as *Riverside Bakery*, ask for a payment, open the link "as the payer would", decline at the first provider, try again.
2. Act as *Helen* and open that order: its whole stream, grouped by wave, and the replay check.
3. `packages/pay/flow/` — the figure is eight short files.
4. `packages/compose/pay-runtime/runtime.test.ts` — "cut into functions".
