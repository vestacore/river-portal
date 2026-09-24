---
type: meta
status: review
tags: [meta, parameters]
aliases: [Parameters, Thresholds]
---

# Canonical Parameters

This is the single source of truth for numbers, thresholds and naming rules that appear in more than one note. Other notes quote a value **and link here**. To change a value, change it here first and then update the notes that quote it. Back to [[00 Home]].

All values are **per-organisation defaults**. An [[Administrator]] can make them stricter in [[Admin Studio]], but can never make them looser than the stated minimums (marked *floor*).

## Safety and publication

| Parameter | Value | Floor | Used in |
|---|---|---|---|
| Minimum group size for any public figure, map cell or breakdown (k-anonymity) | **5** people or households | 5 | [[Visibility Levels]], [[Flow Map]], [[Impact Report]], [[Transparency Ledger]] |
| Delay before public aggregates (counters, ledger lines) | **72 hours** | 72 h | [[Public Portal]], [[Transparency Ledger]] |
| Delay before a delivery appears on the public [[Flow Map]] | **7 days**, or **14 days** in high-risk oblasts | 7 d | [[Flow Map]], [[Location]] |
| Delay before a public [[Journey Story]] after a delivery in a conflict zone | **14 days** | 14 d | [[Journey Story]], [[Publication Pipeline]] |
| Public location precision | Oblast, or city for cities over 100k people; never a street or village | oblast | [[Location]], [[Visibility Levels]] |
| Delay before a delivery appears on the `participants` map | **24 hours** | 24 h | [[Flow Map]] |
| Order of publication gates | **Consent check (DP-09) first**, then editorial approval (DP-10) | — | [[Publication]], [[Publication Pipeline]], [[Content Management]] |
| Time to remove from live pages after consent is withdrawn | **15 minutes** or less | — | [[Consent Management]], [[Publication Pipeline]] |
| Who sets high-risk oblasts | [[Safeguarding]] Lead, reviewed monthly | — | [[Location]] |

## People and access

| Parameter | Value | Used in |
|---|---|---|
| Minimum age to self-register as a [[Recipient]] | **18**. People aged 16–17 ask through a trusted adult or institution | [[Safeguarding]], [[Recipient]] |
| Treated as a child for publication purposes | Everyone under **18**; no identifiable publication | [[Consent Management]] |
| A [[Giver]] may stay anonymous to staff | Below **GBP 5,000** cumulative in 12 months (or equivalent), and no Gift Aid | [[Giver]], [[Privacy Model]] |
| Automatic acknowledgement of a submitted [[Need]] | **Under 1 hour** (system message in the recipient's language) | [[DP-01 Need Triage]] |
| First human contact about a Need | **Within 48 hours**; target 24 hours. Shown as a soft amber timer, never red | [[Coordinator Workspace]], [[Impact Metrics]] |
| Carrier leg-link validity | From assignment until `leg.Closed` + **72 hours** | [[Identity and Access]] |
| Carrier contact details are kept | **72 hours** after the [[Leg]] closes, then redacted | [[Carrier]], [[Data Retention]] |
| Vehicle plate on a leg (cost and customs audit) | **30 days**, `team` only | [[Data Retention]] |
| Verification depths | **V0** face value · **V1** contact confirmed · **V2** corroborated by a referee · **V3** documents seen, not stored · **V4** in person | [[Verification]], [[DP-02 Need Verification]] |
| How long a Need confirmed on carrier evidence alone stays open before it closes automatically | **30 days** | [[Lifecycle of a Need]], [[DP-08 Delivery Confirmation Review]] |

## Money

| Parameter | Value | Used in |
|---|---|---|
| Cost a Lead Coordinator can approve alone | Up to **GBP 250** per [[Cost Record]] | [[DP-06 Cost Approval]] |
| Cost that needs a Finance Steward | Over GBP 250 | [[DP-06 Cost Approval]] |
| Cost that needs two approvers (four-eyes) | **GBP 1,000** or more | [[Accountability and Audit]] |
| Four-eyes at Tier 1 | A named trustee or treasurer holds a lightweight studio account | [[Role]], [[IAP Staff Access]] |
| Refunds | Only before the [[Gift]] is allocated to a [[Flow]]; approved by the Finance Steward | [[Lifecycle of a Gift]] |
| Pooled money is traced | Pro rata to allocations | [[Money Flow and Cost Transparency]], [[Donor Report]] |

## Event naming

The canonical list of events is in [[Event Catalogue]]. The rules:

- `aggregate.PastTenseVerb`, with the aggregate name in camelCase: `need`, `offer`, `gift`, `flow`, `campaign`, `programme`, `consignment`, `item`, `leg`, `hub`, `costRecord`, `deliveryConfirmation`, `gratitudeNote`, `publication`, `article`, `report`, `mediaAsset`, `translation`, `person`, `organisation`, `role`, `consent`, `verification`, `visibility`, `reputation`, `intent`, `partner`, `location`, `category`, `safeguarding`, `dispute`, `whistleblow`, `ai`, `system`.
- These synonyms are fixed:

| Use | Not |
|---|---|
| `consent.Withdrawn` | `consent.Revoked` |
| `person.KeyShredded` | `person.CryptoShredded` |
| `flow.LeadHandedOver` | `flow.LeadCoordinatorChanged`, `role.LeadHandedOver` |
| `flow.MatchSuggested` / `ai.SuggestionMade` | `match.Suggested` |
| `deliveryConfirmation.*` | `delivery.*` |
| `gratitudeNote.*` | `gratitude.*` |
| `costRecord.*` | `cost.*` |
| `role.Granted` (role: auditor) | `auditor.AccessGranted` |
| `reputation.ContestRaised` / `reputation.SignalCorrected` / `reputation.ContestRejected` | `reputation.SignalContested`, `reputation.Adjusted` |
