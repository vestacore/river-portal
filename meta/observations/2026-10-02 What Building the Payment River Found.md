---
type: observation
date: 2026-10-02
tags: [observation, payments, log, idempotency, ui]
---

# What Building the Payment River Found

Back to [[00 Meta Home]]. From [[Iteration 05 — Payment River]].

**What happened.** The payment river was built in layers, each with tests, and every layer passed on its first run. Defects were still found afterwards, in three further ways: by thinking about how webhooks really arrive, by walking the cabinets in a browser, and by an independent review that was given the code and not the author's conclusions.

| # | Found by | What was wrong | What changed |
|---|---|---|---|
| 1 | Asking "what if this arrives twice?" of every world fact | The checkout gate counted *events*: `closed + 1` for each failure. A provider that reports the same failure twice (an expiry after a decline) would have made `closed` exceed `started`, and the gate would never open again. Every test passed, because no test said a thing twice | The gate keeps the attempt under way and closes it when a failure *names it*. A repeated or late report changes nothing. The order view follows the same rule |
| 2 | Looking at the address bar | After the stand-in provider's page, a Server Action redirected to a route handler, which redirected to the invoice. The invoice was shown, under the *return* address — an address that stops working when a cookie expires. Someone would have bookmarked it as their receipt | The action goes straight to the invoice's own address. The route handler remains for a real provider's return, which is a full page load |
| 3 | Reading the page as the operator | Routing reasons and refusals said `stripe` and "no connected provider carries this order" twice over | Providers are named as they name themselves; a refusal says which providers were connected; the merchant is told what to do next instead of being shown the log's words |
| 4 | Switching to Ukrainian | Five stage names under five narrow columns ran into each other; `2.5%` kept its English decimal point; identifiers such as `issueInvoice` were set in small capitals, because an unlayered CSS class beats Tailwind's `normal-case` | The order line has three densities; rates use the locale's number format; identifiers are set in mono without the annotation class |
| 5 | Clicking the same control as two roles | Not a defect, a confirmation: the auditor's pages have no forms at all, and the actions check the role again | — |
| 6 | Independent review, then reproduced with one request | **The operator's pages were authorised only in their layout.** An anonymous request got a redirect — and, in its body, the page beneath: orders, payer handles, the ledger. The walk had shown the redirect and looked no further | Every page establishes who is acting before it reads anything (`requireOperator`), as the studio's pages already did (`requireStage`); the redirect's body is now checked for data, not only its status |
| 7 | Independent review, then reproduced in the production server | **The return address given to providers redirected to `https://0.0.0.0:8080/…`.** A route handler built an absolute address from the server's own idea of its origin, which behind a load balancer is its bind address. It worked under `next dev` | The handler answers with a path. The same request is now made against the standalone build |
| 8 | Independent review | A stand-in's session reference can be worked out from an order's id, so anyone who knew an order's id could open the stand-in's page and "pay" it | The page and its outcome need the payer's own authority — the pay key or the signed-in payer — checked at the door |
| 9 | Independent review | A provider nobody declared became a stand-in wherever the process was not on Cloud Run — also beside a real database and a connected provider | A stand-in by default only in a local river that keeps nothing; beside a durable store it must be asked for and allowed |
| 10 | Independent review | Infrastructure defaults that would have failed the first deployment: a database id one character too short; no merchants passing preview and stopping every function at start | The id is `river-pay`; the stack refuses at preview what the functions would refuse at start |
| 11 | Second review, with a scenario that ran | **An unknown outcome was recorded as a failure.** A PayPal capture that came back *pending*, or met three outages, became `payment.Failed`; the payer was sent to another provider; the first capture, when it completed, was ignored | A controller says what silence means: a page that never opened is a failure, a capture is never one. Pending is its own fact; "already captured" is read back; the provider's later report is heard |
| 12 | Second review, with a scenario that ran | **An order could be withdrawn while its capture was on its way**, and was then charged and flagged | A cancellation is a request; a joiner decides inside the wave and refuses while money is being collected. The same closed the race between the clock and a payer at the moment an invoice expires |
| 13 | Second review, with a scenario that ran | **An abandoned PayPal page held its order for ever**: nothing ended the attempt, the clock skipped it, the door admitted no new word | The clock closes a page left open longer than a session lives; nothing unasked closes an attempt whose capture is being asked for |
| 14 | Second review, with a scenario that ran | **A delivery that failed late reopened an intention another delivery had answered**, and the clock then woke the bank for it on every tick | The outbox entry is read and changed only inside a transaction; a duplicate answer still closes it; the replay check now covers the outbox |
| 15 | Second review | Smaller: a ledger summed over the latest 500 orders and still "balanced"; a staff e-mail address in an append-only fact; Stripe's "key in use" read as a refusal; two calls to PayPal for any unsigned request | The ledger reads every posted order; staff are named by a fingerprint; 409 is retried; PayPal is asked only about events that name an order the river has |

**Why it matters.**
- **Idempotency is a property of the model, not of the transport.** Act keys stop the *same message* from entering twice. They do not stop *two messages that mean the same thing*. That has to be decided where meaning lives: in the listener's state. The question to ask of every fact from the world is "what if it is said again, by another message, later?".
- **A passing first run proves the code agrees with its author.** The tests for the gate were written by the same reasoning that wrote the gate. The defect was outside that reasoning.
- **The address bar is part of the interface.** In a payment, the address the payer is left on is the receipt.

- **A status code is not a body.** `307` looked like "denied". The data was in the same response.
- **Silence is not an answer.** Rows 11 and 13 are one mistake seen twice: treating "nothing came back" as if it said something. For a page it may be read as "nothing happened"; for money it may not be read at all.
- **A check outside the transaction is a courtesy.** Rows 12 and 14: what was read a moment ago was acted on as if it were still true. The model already had the place where such a decision belongs — the wave — and it was not being used.
- **The author's walk and the reviewer's read find different things.** The walk found what a person sees; the review found what a person is never shown — a response body, a production-only address, a default that only matters elsewhere. Neither replaced the other, and neither would have found the gate defect, which needed the question "what if it is said twice?".

**What we keep.**
- For every fact with origin `world`: a test in which it arrives twice, and one in which it arrives late.
- After any redirect chain, check `location.pathname`, not only the page.
- For every page behind a sign-in: request it as nobody and search the *body* of the answer for data.
- Check redirects against the production server, with the bind address a container uses.
- Walk each cabinet in the second language before calling it done.
- Give a payment system to a reviewer who has not seen the reasoning, and reproduce each finding before acting on it.
- For every intention: say what three failures in a row mean — and if the honest answer is "we do not know", never turn it into a fact.
- For every guard at a door or a clock: ask whether the figure decides it too. If only the door does, it is not decided.
