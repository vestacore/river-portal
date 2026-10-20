---
type: observation
date: 2026-10-19
tags: [observation, payments, psp, ui, i18n, agents, review]
---

# What Walking the PSP Cabinets Found

Back to [[00 Meta Home]]. From [[Iteration 06 — PSP Portal]].

**What happened.** The PSP portal was built in layers with tests, and two cabinets' worth of pages — compliance and access; the integrator and what follows the mouth — were written by two agents in parallel, each told to change only its pages and to *report*, not fix, what it found wrong below them. Their reports, then a walk through every role in the browser at desktop and phone width, found the following. Each was reproduced before it was changed.

| # | Found by | What was wrong | What changed |
|---|---|---|---|
| 1 | Agent, building the queue of held attempts | **Money that did not match could never be settled.** `funds.Mismatched` held a session in review with no review and no alert; the only command that decided a hold refused it. The fact's own meaning said "an officer decides" | The guard opens an alert and the session view carries the review and the amounts. A person — compliance, or an operator of the unit — takes what arrived (never more than was due; the invoice stays due for the rest) or returns it and ends the attempt. Two tests |
| 2 | Agent, building onboarding | **Approval at onboarding was enough to trade.** An approved merchant whose contract was still a draft could take payments, at a fee of 0 | An order is refused without an active contract. Test |
| 3 | Agent, building contracts | Steps were taken from the stored status while every page showed the status of today, so an expired contract could never be renewed. The step map was private, and the page repeated it | `contractSteps` lives in `@river/psp-contracts`; the step is taken from `contractStatusAt`. Test |
| 4 | Agent, reading the audit trail | A declined access request left no line; a hold decided by an administrator was recorded as decided by a compliance officer; grant lines named a role code and a person's id | Every decision is a line, with the role the person acted in and names in both languages. Test |
| 5 | Agent, switching to Ukrainian | Onboarding checks, document titles, request reasons and alert notes were English strings on Ukrainian pages | They are localised text; a person's own words stand as typed in both languages |
| 6 | Agent, reading the seed | An access request was marked approved, but its role was never granted | The grant exists |
| 7 | Agent, building payouts | **Holds had no effect.** The Sentinel proposed holding payouts of payments already paid out; the proposals were decided after the payout run | The Sentinel proposes a hold only while a share is still to be paid; a hold is decided within hours, before the run; a story in the history shows one that holds |
| 8 | Agent, building disputes | The demo had no open dispute, so evidence could never be submitted; evidence was stamped three days after a dispute whatever its own moment | The newest disputes wait for the operator; evidence carries its own time |
| 9 | Agent, building the integrator's overview | No refused call to show; treasury forecasts recorded once and visible only at the root | A few refused calls in yesterday's log, one with a revoked key; forecasts per legal entity, of their day, each superseding the last one still open |
| 10 | Agent, reading Ukrainian texts | "4 збоїв поспіль", "3 часток", "2 рядків"; raw minor units in the reconciler's words | Counts are written by each language's plural rules (`counted`, `pluralise`); amounts as money |
| 11 | Agent, building payouts | It reported that a reserve paid out would leave the merchant's payable account | Not so: a reserve share keeps rule −1 and its payout debits the reserve. A test now says it |
| 12 | Walk, compliance queue | An instrument and its bank ran into the next field | The instrument cell wraps |
| 13 | Walk, payouts | An agent's proposal and its buttons squeezed into a narrow column | The proposal wraps above its buttons |
| 14 | Walk, refunds in Ukrainian | Refund reasons were English sentences in the facts; amounts in the audit trail were raw | Refund reasons are codes with labels in both languages; a person's other words stand as typed |
| 15 | Walk, the pay page after a transfer that fell short | **"Payment confirmed — your invoice is paid" for an invoice still ₴500 due** | The page offers the rest, with what is already paid above it |
| 16 | Walk at phone width | Horizontal scroll on six pages: the scope picker, panels in grids, a table without its scrolling frame, long status labels — and a visually hidden label positioned outside a scrolling table | Panels never widen their track; every table scrolls in its own frame, which also contains what is positioned inside it; long statuses wrap. Every public page and every cabinet section was checked at 375 px |
| 17 | Agent, documenting webhooks | The brief said "HMAC of the body"; signing the body alone leaves the timestamp unauthenticated | The documented scheme signs the timestamp, a full stop and the raw body. The stand does not sign its simulated deliveries |

**Why it matters.**
- **A fact that holds a river needs a door out.** Row 1 is a model gap, not a slip: a stage with no command that can end it. Every fact that stops an attempt should name who decides, and the decision should be a command with a test.
- **"Approved" and "may trade" are different facts.** Row 2 joined them by accident. Where the product has two conditions, the code should check both, at the door that matters — here, the order.
- **The status a person sees is the status to act on.** Row 3: a step taken from a stored value while the page shows a derived one is a promise the page cannot keep.
- **A seed is a test of the product's stories.** Rows 7 to 9: the history replays real commands, so a story that never happens in it is a feature nobody can see in the demo. Each story the product promises should exist in the history.
- **An agent that only reports keeps the boundary clean.** The builders were told not to change the packages; their reports were better for it, and one of them (row 11) was wrong — which a fix in passing would have hidden.

**What we keep.**
- For every fact that puts a session in `review`: the command that ends it, who may use it, and a test of each way out.
- For every derived status shown on a page: the commands take their decision from the same derivation.
- For every promise of the showcase (a hold, a dispute, a refused call): a story in the seeded history that makes it visible.
- Every page at 375 px with `scrollWidth` checked by script, not by eye.
- Builders report what they find below their layer; the fix is made — and reproduced — by whoever owns that layer.
