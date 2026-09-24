---
type: privacy
status: draft
tags: [privacy, minimisation, privacy/sensitive, form]
aliases: [Minimisation, What We Never Ask]
related: ["[[Help Seeker Section]]", "[[Person]]", "[[Need]]"]
---

# Data Minimisation

We collect the least data that lets help arrive safely, and nothing that could be used to judge, exclude or endanger someone. Back to [[Privacy Model]].

> [!principle] A need is respected
> Nobody has to perform suffering to receive help. Forms ask what is needed to deliver, not what is needed to decide whether someone "deserves" it. — [[Guiding Principles#P2. A need is respected]]

## Tests every field must pass

1. **Delivery test.** Would help fail to arrive, or arrive in the wrong form, without this field?
2. **Safety test.** Could this field, if leaked or subpoenaed, put the person at risk (in a conflict zone, in a household, with an employer)?
3. **Judgement test.** Could this field be used to rank people by worthiness? If yes, it is not collected.
4. **Precision test.** Is a coarser form enough (age band vs date of birth, oblast vs address, "medical" vs diagnosis)?
5. **Timing test.** Can we ask later, only if it becomes necessary (address only once a delivery is planned)?

A field that fails 1 or passes 3 is removed. Fields that pass are listed below with their justification; adding a field requires updating this note and a DPIA line.

## What we never ask

| Never asked | Why |
|---|---|
| Religion, church membership, beliefs | Aid is never conditional on belief ([[Ethics Charter#3. No proselytising, no political capture]]) |
| Political views, party membership, voting | Neutrality; risk under occupation |
| Ethnicity, nationality, language as a filter | Needs are met regardless; UI language is a preference, not a category |
| Military service of family members, unit, deployment | Serious security risk if leaked |
| Income, bank statements, proof of poverty | Violates P2; verification is proportionate and about the claim, not about poverty |
| Passport / ID number, tax number | Not needed to deliver; a photo of ID is **never** stored. Where a partner legally requires ID, the partner collects it |
| Full date of birth | Age band is enough |
| Sexual orientation, gender identity | Not relevant to delivery |
| Criminal record | Not relevant; carriers' checks are handled outside the portal (see [[Safeguarding]]) |
| Precise GPS coordinates from device | Addresses are typed; device location is never read silently |
| Photos of the person's home or face "as proof" | Pity imagery by the back door; see [[Ethics Charter#5. No pity imagery]] |
| Social media profiles | Not needed; risk of profiling |

## Form field justification — Need intake

The public form in [[Help Seeker Section]]. Fields marked *later* are asked only once a [[Flow]] is forming.

| Field | Required? | Stored level | Justification | Coarsest acceptable form |
|---|---|---|---|---|
| What do you need? (category + free text) | yes | `private` / `participants` (category) | Core of the need | Category alone |
| In what form? (goods / money for a purchase / service / transport) | yes | `participants` | Water arrives in the form needed ([[The River Concept]]) | — |
| Where? (oblast + settlement) | yes | `private` (settlement), `participants` (oblast) | Routing ([[DP-05 Routing and Carrier Assignment]]) | Oblast + nearest town |
| By when? | optional | `team` | Prioritisation; "as soon as possible" is a valid answer | — |
| How many people will it help? | optional | `team` | Quantity; never used to rank | Number only, no names |
| Contact channel (phone / email / messenger) | one of them | `private` | To reach the person and send a tracking link | One channel |
| Your name or how to address you | yes | `private` | Dignity in contact | Any name the person chooses |
| Are you asking for someone else? | yes | `private` | On-behalf-of requests ([[Recipient]]) | Yes/no + relationship |
| Health details | only for medical needs | `private` / `sealed` | Correct medicine, cold chain | "Medical" + item, no diagnosis unless needed |
| Children in the household | only if the item is for a child (size, formula) | `sealed` for details | Correct sizes | Age band, no names |
| Delivery address | *later* | `private` | Home delivery | Pick-up point instead |
| Accessibility needs (e.g. cannot carry heavy items) | optional | `private` | Safe delivery | Free text |
| Why are you asking? ([[Intent Statement]]) | optional | `team` | Clarity, never judgement | Can be skipped |

## Form field justification — Offer and Gift

| Field | Required? | Level | Justification |
|---|---|---|---|
| Name | yes (can be "anonymous" publicly) | `private` | Accounting, thanks |
| Email or phone | yes | `private` | Receipt, [[Donor Report]], gratitude |
| Amount / goods description | yes | `private` | The gift itself |
| Gift Aid declaration (UK taxpayers) | optional | `private` | Legal requirement to claim; home address only if Gift Aid is chosen |
| Company / sponsor details | sponsors only | `team` | Restricted funds, invoices |
| Name display preference | yes (default: don't show) | `private` | [[Consent Management]] |

## Form field justification — Carrier

| Field | Required? | Level | Justification |
|---|---|---|---|
| Name, phone | yes | `team` | Coordination of the [[Leg]] |
| Vehicle type and capacity | yes | `team` | Load planning |
| Registration plate | only for border paperwork | `team`, deleted after the leg | Customs/humanitarian convoy lists |
| Driving licence number | **not stored** | — | Checked by a coordinator by sight; the check itself is logged |
| Bank details for reimbursement | only if reimbursed | `private`, Finance Steward | Reimbursement of [[Cost Record]]s |

## Minimisation in the system

- **Free text** is PII-scrubbed before it enters the log, and what remains is stored encrypted with the author's per-person key. Events therefore contain **no plaintext PII**, and crypto-shredding covers free text too ([[Privacy Model#Separation of PII from events]], [[Event Log and Projections#Crypto-shredding]]).
- **Media** has EXIF/GPS stripped on upload; faces blurred by default in anything above `private` ([[Media Asset]]).
- **Leg-scoped data** given to carriers expires automatically.
- **AI prompts** sent to [[Vertex AI Integration|Vertex AI]] receive redacted text only; health details are never sent.
- **Analytics** on the public site are cookieless and aggregated; no third-party trackers on help-seeker pages.

## Related
[[Data Retention]] · [[Visibility Levels]] · [[Help Seeker Section]] · [[Giver Section]] · [[Person]] · [[Verification]]
