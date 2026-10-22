---
type: observation
date: 2026-10-20
tags: [observation, payments, orchestration, routing, reconciliation, agents, ui, i18n, review]
---

# What Reframing the PSP as Orchestration Found

Back to [[00 Meta Home]]. From [[Iteration 07 — Payment Flow Orchestration]].

**What happened.** The PSP portal of [[Iteration 06 — PSP Portal]] was reframed as a payment flow orchestration platform, with a retail group's stand beside the PSP's. The packages were changed first, with tests, and the site was written in one voice. Three agents then built the cabinets in parallel. Each had its own files, one glossary and one tone, and was told to report doubts rather than reach outside its files. Their reports, a walk in the browser and scripted checks found the following. Each was reproduced before it was changed.

| # | Found by | What was wrong | What changed |
|---|---|---|---|
| 1 | Building direct settlement | **Holding the money was an assumption in four places:** the fee recipient was always the platform, payouts ran for every share, the ledger had no clearing with a bank, and a reserve could be carved out | `settlement.model` became a policy. The fee share names its acquirer (`acq:<id>`); direct batches pay nothing out; the ledger reads clearing, fees and payables; the group keeps no reserve |
| 2 | Seeding the retail history | Quirks keyed by business day missed their batches: the history did not start at midnight. A policy changed in the story was evaluated before its time, so stores kept their old terminal bank | The history starts at midnight; story changes run through the queue at their moment |
| 3 | Seeding the retail history | Weighed goods picked above the estimate left orders partly paid; bonus points taken for an order whose card part failed stayed taken | Weighed goods are picked up to the estimate when a hold covers them; failed card parts give the points back, and a daily sweep cancels what is left |
| 4 | The agents' board | The Navigator proposed "least cost" when it cost the same as "on-us first". A finding about a standing condition stayed open after the condition was gone, or kept the figures of its first round for two months | Ties prefer on-us. Findings form series: a newer one supersedes, one no longer found is closed as no longer current, and one found again a day later with other figures is replaced |
| 5 | The agents' board | In direct settlement the Sentinel proposed holding payouts that do not exist | It opens an alert instead |
| 6 | Agent, routing studio | **The approval threshold could not be lowered.** The policy combines by `max` from its declared default (90 %), so a group's 85 % was saved and ignored | The platform's floor is 80 %. The group may set anything above it; units below may only raise it. The studio shows a saved setting that has no effect |
| 7 | Agent, connections | Live order queue empty: the history picked every order within hours, so "holds awaiting picking" showed nothing and the capture after picking could not be shown | The last six orders of the history wait for picking. An operator can report picking from the order's page, as the order system would |
| 8 | Agent, connections | Payment at the door recorded picking without saying what changed | The weighed lines' differences are recorded |
| 9 | Agent, settlements | A provider's non-card payments were one line of its report, named after whichever instrument came first | Non-card instruments have a line each |
| 10 | Walking the payer's path | The retail pay page said "Card data stays with the PSP" and "Powered by River Pay", and a held payment "the merchant takes when the goods ship" | Neutral texts for both assemblies; a held payment is charged after picking or shipment, and the rest released |
| 11 | Walking the cabinets | River words in the cabinets' prose — delta, streams, the river runs, bridges — and "the swarm" | Pages speak of events, shares and distribution, and of agents; the drawings keep the river |
| 12 | Phone-width check | One section scrolled sideways: the search field had a fixed width beside a period filter | The search field shrinks; every cabinet section of the administrator and every site page fit 375 px |
| 13 | Reading Ukrainian pages | Two names for one strategy ("найнижча" and "найменша вартість"); the routing policies printed their codes | One name; routing strategies, the settlement model and terminal banks are worded for people |
| 14 | The demo's entrance | The group's regional auditor had a grant but no way in | She is offered with the others |

**Lessons**
- **An assumption shows when a second assembly is built.** The PSP's code had no line that said "the platform holds the money"; the assumption sat in four places that only a second assembly could reach. A second stand is a cheap test of what the core really assumes.
- **A seeded story is a replay too.** It must run through the same queue as everything else. A story evaluated ahead of time shows a world the replay would not produce.
- **Agents need the life cycle of a finding, not only its first appearance.** A finding about a standing condition must be refreshed, superseded or closed, or the board will show a two-month-old figure as today's.
- **Parallel agents work with one glossary and a strict file list.** As on 2026-09-24 ([[2026-09-24 Parallel Authoring Needs a Harmonisation Pass]]), a harmonisation pass was still needed for names, menus and wording; the reports of doubts were more useful than any fix an agent could have made outside its files.
- **Check the payer's path, not only the cabinets.** Two of the frame's leaks were on the pay page, which no cabinet review would have opened.
- **zsh's `path` is `PATH`.** A loop variable named `path` empties the search path mid-script; use another name.
