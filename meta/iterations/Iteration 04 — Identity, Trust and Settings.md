---
type: iteration
status: review
date: 2026-09-25
tags: [iteration, identity, trust, settings, profiles]
---

# Iteration 04 — Identity, Trust and Settings

Back to [[00 Meta Home]]. Follows the vectors of [[2026-09-25 Site Map and Domain Review]].

## Goal
- **V1 — identity.** Every role can be walked, locally, without IAP: demo personas, "My river" for each role, and a guided walk.
- **V4 — trust.** A first visitor learns who we are, what we do, where and since when, and can check it:
  - a concrete promise, three doors, a live trust strip;
  - About, Transparency, Contact, Questions and answers;
  - four policies (privacy, safeguarding, complaints, accessibility).
- **V5 — quick wins.** A quick exit, an emergency notice, other ways to ask, referrals when we cannot help, and lighter fonts.
- **Owner's additions:**
  - blocks and parts of the site are configurable **in the studio only**, never on public pages;
  - the whole system is parameterised through a **settings registry**, with three profiles (state programme, city foundation, small organisation across the country) used from now on for testing and evaluation.

## What was built
| Area | Result | Decision |
|---|---|---|
| Settings | `@river/settings`: 35 typed settings in 8 groups, floors, contrast check, `{{key}}` tokens; `@river/config`: settings as events; three profiles | `adr/records/ADR-0020 Settings Registry and Organisation Profiles.md` |
| Identity | `@river/identity`: 12 roles, signed sessions, IAP / demo / none; nine personas; `/demo`, `/demo/walk`, `/me` | `adr/records/ADR-0021 Identity Layer and Demo Personas.md` |
| Studio | Seven stages following the river (overview, inflow, channels, tolls, mouth, surface, settings), each with *see* and *act* roles; capacity recorded on every action | ADR-0021 |
| Editing | Site texts and page structure edited in the studio; public pages carry no editor | `adr/records/ADR-0022 Editing in the Studio, Not on Public Pages.md` |
| Money | Reporting currency in settings; each cost keeps its currency and rate; DP-06 checked in the domain | `adr/records/ADR-0023 Reporting Currency and Recorded Conversion Rates.md` |
| Trust pages | About, Transparency (open ledger with caveats), Contact, Questions and answers, four policies; texts written once with tokens for all profiles | ADR-0022 |
| Safety | Quick exit (button, or Esc twice) on help pages, the tracking page and a recipient's "My river"; emergency notice; referrals; privacy link beside the form | `spec/09-privacy-ethics/Safeguarding.md` |
| Fonts | IBM Plex Sans 400/600 plus italic, Mono 400; Latin and Cyrillic subsets only | V5 |

## Log
- 2026-09-25: Registry first, then identity, then pages. A content agent wrote the profile texts, page texts and demo variants in parallel. They were then reviewed against privacy rules; the city warehouse's district was removed from a public route label.
- 2026-09-25: Every command now receives the settings in force (`CommandEnv.settings`). Constants for conversion rates and the approval limit were deleted.
- 2026-09-25: Walked all ten steps of `/demo/walk` in the browser, as each persona, in both languages. The walk found thirteen defects that type checks and unit tests had not caught; see [[2026-09-25 Walking Every Role Found What Tests Missed]].
- 2026-09-25: Crawled every route as each persona to check the role matrix. The results were exactly as designed: an auditor sees all stages and acts in none; recipients and carriers get 404 in the studio and 200 in "My river".
- 2026-09-25: Production build passes (28 routes plus the proxy). The public surface serves no `/demo`, `/me` or `/studio` (404) and shows no demo controls.

## Evaluation by profile
Figures are from the demo seed of each profile, computed from the log by the same projections the site uses.

| | State programme | City foundation | Small nationwide |
|---|---|---|---|
| Name and promise | *One River*: "Every oblast, one river of help" | *Warm Bridge*: "From neighbour to neighbour, in Dnipro and the oblast" | *Open River Aid*: "Help flows to where it is needed" |
| Currency, suggested gifts | UAH; ₴200 / 500 / 1,000 / 5,000 | UAH; ₴100 / 250 / 500 / 1,000 | GBP; £10 / 25 / 50 / 100 |
| Coordinator's approval limit (DP-06) | ₴50,000 | ₴10,000 | £250 |
| Safety delay before a public report | 21 days | 14 days (floor) | 14 days (floor) |
| We reply within | 3 days | 2 days | 2 days |
| Areas served | all 25 ("Across Ukraine") | Dnipropetrovsk oblast | 7 oblasts in the east and south |
| What people can give | money, goods, transport, service, time | money, goods, time, transport | all five |
| Home page order | promise, trust, doors, counters, how, campaigns, **reports before feed**, thanks, about | promise, **doors before trust**, counters, **campaigns before how** … | promise, trust, doors, counters, how, campaigns, feed, thanks, reports, about |
| Money received · delivery costs · share | ₴605,000 · ₴87,000 · 14% | ₴121,000 · ₴17,560 · 15% | £2,420 · £920 · 38% |
| Accent | yellow `#f2c230` | teal `#5cc4b8` | orange `#f0962a` |

What works:
- **The three profiles read as three different organisations.** Each has its own headline (the tagline is now the default headline), colour, section order, currency and way of giving. One code base and one set of texts produce all three, because the texts use tokens.
- **The first visitor gets what V4 asked for** in one screen and one scroll:
  - who we are, what we do and where;
  - since when, and a registration;
  - the share of money spent on delivery, and when the last delivery was confirmed;
  - three doors and other ways in.

  The About, Transparency and policy pages answer the next questions.
- **Operators see the river.** The overview counts what waits at each stage, and each person's stages are marked. The Finance Steward's view is three stages; the editor's is publishing and settings.
- **Parameters behave as rules.** The same van hire is approved by the coordinator in one profile and waits for the Finance Steward in another. The 21-day delay of the state programme refuses early publication unless the editor acknowledges it.

What does not work yet, or reads badly:
1. **The cost share is misleading for a transport fundraiser.** *Open River Aid* shows "38% of money received went on delivery costs". For a campaign whose purpose *is* the fuel, the ferry and the tolls, that is the point, not overhead. In-kind gifts (the generator) have no money value, so the share is overstated. Options, in order of preference:
   - (a) give in-kind gifts a declared value and show "value delivered per pound spent";
   - (b) link the trust item to the Transparency caveats;
   - (c) let the organisation drop `costShare` from `home.trust`, which it can already do.
2. **Scale is not simulated.** Every profile has the same six needs, two campaigns and one report, scaled in money only. The state programme does not *feel* national, and the studio's queues are never long enough to test filters or triage. Next: a volume seed for the state profile (hundreds of requests, several hubs and partners).
3. **Long registration lines.** The state and city registrations fill two lines of the trust strip on a desktop and four on a phone. A short form of the registration for the strip would help.
4. **One oblast weakens pseudonymisation.** For the city foundation every delivery is in one oblast, so "Dnipropetrovsk oblast" hides little. The k-anonymity rule (minimum group of 5, `spec/00-meta/Canonical Parameters.md`) and the 72-hour delay for aggregates (TD-08) matter most for this profile and are not built.
5. **Profiles are parameters, not capabilities.** The state programme should switch on partners, hubs and programmes, and the small organisation might switch off public intake. The feature switchboard of `spec/01-business/Scaling Tiers.md` is not in the registry yet (TD-21).

## How to test
- **Everything locally, as any persona:** `npm run dev`, then `/en-gb/demo`. The default profile is `small-nationwide`; start with another using `RIVER_PROFILE=state-programme npm run dev`, or switch on `/demo` (this resets the demo data).
- **The public surface of each profile, as a visitor sees it:** `npm run build --workspace @river/web`, copy `.next/static` into the standalone output, then start the launch configurations `web-public` (3100), `web-public-state` (3101) and `web-public-city` (3102).
- **Checks:** `npm test` (26 tests, including the seed of every profile and the walkability of the demo), `npm run topology`, and `tsc --noEmit` for the packages and the web app.

## Next
- A volume seed for the state programme, then the V2 and V3 vectors of the review (the journey of a gift and the carrier's leg).
- Real public sign-in with Firebase (TD-15) before any real recipient or giver uses "My river".
- The feature switchboard as settings (TD-21).
