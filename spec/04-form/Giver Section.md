---
type: form
status: draft
tags: [form, giver, sponsor, offer, tier/1, tier/2, tier/3, tier/4, open-question]
aliases: [Give, Right Bank UI, Дарувати]
related: ["[[Giver]]", "[[Sponsor]]", "[[Offer]]", "[[Gift]]"]
---

# Giver Section

How people and organisations give, and how they see what their gift became. Back to [[Portal Q&A]]. Routes: [[Site Map]] (`/give`, `/me/giving`).

Designed around **James** (monthly giver, Leeds) and **Sarah** (sponsor lead). See [[Audiences and Personas]].

> [!principle]
> A gift is a gift ([[Guiding Principles#P1. A gift is a gift]]). Nothing is bought: no badges for amounts, no tiers of donor status, no "unlock" mechanics. The form is shaped by **what is needed**, not by what is easiest to sell.

## Ways to give

The `/give` page opens with five tiles and, under them, a live panel titled **What is needed now**. It shows aggregated open needs grouped by form (e.g. "Heating: 23 households · Power: 9 generators · Transport: 2 legs Lviv → Kharkiv"), and never shows persons.

| Form | Route | What happens | Becomes |
|---|---|---|---|
| **Money** | `/give/money` | Choose a campaign or "where most needed", then an amount and currency, one-off or monthly. You are redirected to external checkout (Stripe Checkout, bank transfer details, Monobank jar) | [[Offer]] (pledge) → [[Gift]] `received` via provider webhook |
| **Goods** | `/give/goods` | A form shaped by current needs (see below). Drop-off at a hub or a collection is arranged | Offer → `clarifying` → `accepted` → Gift(s) |
| **Service** | `/give/service` | A skill (repair, legal, medical, translation), availability and area | Offer → Gift `scheduled` |
| **Transport** | `/give/transport` | Vehicle, capacity, corridor, dates, whether you want costs reimbursed or will cover them | Offer → [[Carrier]] on a [[Leg]] |
| **Time** | `/give/time` | Packing, sorting, calling, translating. Place and hours | [[Volunteer]] tasks |

Sponsors use `/give/money` with *Fund a purpose*, which creates a restricted fund (e.g. "Diesel, Lviv → Kharkiv, Q4 2026"). See [[Sponsor]] and [[Money Flow and Cost Transparency]].

## The offer form, shaped by needs

```
┌───────────────────────────────────────────────────────┐
│ What would you like to give?                          │
│ [ Generator ▾ ]  Most needed now: 2–5 kW, petrol       │
│                                                       │
│ Condition   ( ) New  ( ) Used, working  ( ) Needs fix │
│ Quantity    [ 1 ]                                      │
│ Where is it?  [ Leeds, UK        ]                     │
│   ⓘ From the UK, carriage to Lviv costs about          │
│     GBP 40–60 per item. Would you like to add          │
│     transport to your gift?  [ Yes, add GBP 50 ]       │
│                                                       │
│ Anything we should know?  🎤                          │
│ Why are you giving? (optional, one line)              │
│                                    [ Offer this → ]    │
└───────────────────────────────────────────────────────┘
```

- **Category-first**: the item picker shows [[Category]] items that match open needs at the top, with specifications ("2–5 kW") taken from needs in aggregate.
- **Honest transport hint**: an estimate from past [[Cost Record]]s for that corridor. This encourages givers to fund carriage too, because a gift that cannot travel does not help.
- **Low-need items** show a gentle note: "We have enough winter coats right now. Would you consider …?" The offer can still be submitted. It may be *declined with thanks* at [[DP-03 Offer Acceptance]].
- **Intent line**: an optional [[Intent Statement]]. Offers with conditions (publicity, messaging, data collection) are declined on principle. See [[Ethics Charter]].

## "My giving" dashboard

`/me/giving` is signed in with Firebase Authentication (email link or Google/Apple). Guest givers can claim past gifts by verifying the same email.

```
┌ My giving ─────────────────────────────────────────────┐
│ Since March 2025 you have taken part in 7 journeys.     │
│                                                        │
│ ● GBP 20 / month  → Fuel for convoys          [Report] │
│   Oct: allocated to Flow “Heaters for Izium”            │
│   ◉──◉──◉──◉──○  asked·gathered·carried·arrived·thanked │
│                                                        │
│ ● 1 generator (Sep) → Kharkiv oblast  ✓ confirmed       │
│   “Дякуємо, тепер у школі світло” — a teacher   [uk/en] │
│                                                        │
│ Visibility of my name: Anonymous ▾      Receipts ▾     │
└────────────────────────────────────────────────────────┘
```

- Each gift shows its **journey**: allocated to which [[Flow]], carried over which legs (by corridor, with carriers pseudonymised unless they consent), delivered, confirmed, thanked.
- Money gifts are traced **pro rata** where pooled ("Your GBP 20 was 1.6% of the October fuel fund. That fund paid for 1,240 L of diesel across 4 legs"). The allocation rule is defined in [[Money Flow and Cost Transparency]].
- It shows **what happened together**, never totals ranked against other givers. See [[Recognition Anti-Patterns]].
- Receipts: provider receipts, a Gift Aid declaration (UK) and an annual statement as PDF.
- Recurring gifts can be managed (pause, change, stop) through a link to the payment provider's portal.

## Donor reports

- A **per-giver [[Donor Report]]** is generated when a flow the gift took part in reaches `reported`. For sponsors it is also generated on a schedule (monthly or quarterly).
- It is `private` by default. The giver may publish it (e.g. Sarah's company social value page). Publishing produces a `public` rendition with recipients pseudonymised and a check at [[DP-10 Report Publication]].
- The report contains a journey timeline, the costs funded with receipt thumbnails (where safe), map corridors, delivery confirmations and any consented gratitude.

## Visibility choices

Per giver and per gift, in plain words:

| Choice | Public shows | Participants see | Organisation sees |
|---|---|---|---|
| **Anonymous** (default) | nothing | "a giver from the UK" | name, contact, amount |
| **First name + town** | "James, Leeds" | same | full |
| **Full name / organisation** | name or logo in the supporters band | same | full |
| **Show the amount** (separate opt-in) | amount next to the chosen name | same | full |

- Amounts are **never** public unless the giver opts in separately, and are never sorted by size.
- A change is logged as a visibility change and projections update within minutes. See [[DP-12 Visibility Change]] and [[Visibility Levels]].
- Anonymity *towards the organisation* is limited by anti-money-laundering and Gift Aid rules: it is allowed below GBP 5,000 cumulative in 12 months (or equivalent) and without Gift Aid ([[Canonical Parameters]]).

> [!question]
> What is the giver anonymity threshold towards the organisation, per jurisdiction (UK, EU, UA), and is it configurable per organisation? See [[Privacy Model]] and [[Open Questions]].

## Receiving gratitude

- When a recipient sends thanks with visibility `participants` or wider, every giver in the flow receives it in "My giving", plus an email or push notification if they opted in. See [[Gratitude Loop]] and [[Notifications]].
- The thanks is shown in its original language with a translation toggle. A machine translation is labelled as such. See [[Multilingual Experience]].
- Givers may reply with a short message. It goes to the coordinator first, who passes it on if appropriate. Givers and recipients never exchange contact details through the portal.
- The organisation's own acknowledgement ("We received your GBP 20") is visually distinct from a recipient's thanks. We never write thanks in a recipient's voice.

## Refunds and changes

A giver can withdraw an offer before acceptance. Money refunds follow the payment provider's window and are possible before allocation. After allocation the giver is offered a full account instead. Every refund appears as new log events. See [[Portal Q&A]] B6.
