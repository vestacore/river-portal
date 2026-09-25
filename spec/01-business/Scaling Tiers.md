---
type: business
status: draft
tags: [business, scaling, tier/1, tier/2, tier/3, tier/4]
---

# Scaling Tiers

One platform, four levels of use. Features are switched on by configuration, not by migration. Technical counterpart: [[Scaling Architecture]]. Back to [[Business Overview]].

## Tier 1 — Spring
*"We are raising money to drive one van of aid to Kharkiv."*
- One [[Campaign]] page with a goal (e.g. fuel and transport costs)
- [[Offer]]s of money recorded (via payment link or manual record)
- One or two [[Coordinator]]s; [[Cost Record]]s for fuel, tolls, ferry
- [[Delivery Confirmation]] with photos, then an automatic [[Report]]
- [[Transparency Ledger]] for the campaign; [[Gratitude Note]]s to all givers
- Demo: [[Scenario A — Transport Fundraiser]]

## Tier 2 — Stream
*"We run a small charity with ongoing requests and a storeroom."*
- Everything in Tier 1, plus the public [[Help Seeker Section]] for [[Need]]s
- Goods [[Offer]]s, one [[Hub]], [[Item]] inventory
- [[Flow]]s linking many gifts to many needs; [[Journey Story]] publications
- [[Donor Report]]s per giver; [[Content Editor]] for articles

## Tier 3 — River
*"We coordinate across a region with partners, several warehouses and many drivers."*
- Multiple [[Hub]]s, multi-[[Leg]] routes, many [[Carrier]]s
- Several coordinators per flow with explicit [[Coordination Model]] and hand-offs
- [[Partner Organisation]]s sharing needs and offers
- [[Programme]]s grouping campaigns; [[Flow Map]]; [[Impact Report]]s
- Stronger [[Verification]] and [[Safeguarding]] workflows
- Demo: [[Scenario B — Regional Aid Hub]]

## Tier 4 — Basin
*"We run a humanitarian programme across countries, languages and funders."*
- Multiple [[Organisation]]s (tenants or partners) and programmes
- Restricted funding, grant reporting, auditor access
- [[Vertex AI Integration]] for translation, summarisation, matching suggestions and report drafting
- Data residency and retention controls ([[Data Retention]])
- BigQuery analytics over the log ([[Scaling Architecture]])
- Demo: [[Scenario C — Humanitarian Programme]]

## Feature switchboard (summary)

| Capability | T1 | T2 | T3 | T4 |
|---|:-:|:-:|:-:|:-:|
| Campaign page and money offers | ● | ● | ● | ● |
| Cost records and transparency ledger | ● | ● | ● | ● |
| Delivery confirmation and gratitude | ● | ● | ● | ● |
| Public need intake | ○ | ● | ● | ● |
| Goods, hubs and inventory | | ● | ● | ● |
| Multi-leg transport | | ○ | ● | ● |
| Partner organisations | | | ● | ● |
| Programmes and grants | | | ○ | ● |
| AI assistance (Vertex) | | ○ | ○ | ● |

● standard · ○ optional

## Organisation profiles (added 2026-09-25, engineering iteration 04)
The software ships three **profiles**: presets of the settings registry used to set up, test and evaluate the portal for three kinds of organisation. A profile sets *parameters* (currency, thresholds, delays, texts, the order of the home page). It does not yet switch *capabilities*; the switchboard above is still to be built as settings.

| Profile | Closest tier | Example organisation (fictional) | What the profile sets |
|---|---|---|---|
| `small-nationwide` | Tier 1–2 (Spring → Stream) | *Open River Aid*: volunteers driving vans from Leeds to the east and south of Ukraine | GBP; £10–100 gifts; £250 approval limit; 7 oblasts; the original demo |
| `city-foundation` | Tier 2 (Stream) | *Warm Bridge*: a charitable foundation in Dnipro with drop-off points | UAH; ₴100–1,000 gifts; ₴10,000 limit; one oblast; drop-off points; doors first on the home page |
| `state-programme` | Tier 3–4 (River → Basin) | *One River*: a national programme with regional hubs and partner NGOs | UAH; ₴200–5,000 gifts; ₴50,000 limit; all oblasts; a 21-day safety delay; reports before the feed |

Engineering decision: `adr/records/ADR-0020 Settings Registry and Organisation Profiles.md`. Evaluation: `meta/iterations/Iteration 04 — Identity, Trust and Settings.md`.

