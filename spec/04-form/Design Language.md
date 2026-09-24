---
type: form
status: draft
tags: [form, design, brand, tokens, motion, dataviz]
aliases: [Design System, Visual Language, Дизайн-мова]
related: ["[[Brand and Tone of Voice]]", "[[Accessibility]]", "[[Frontend Application]]"]
---

# Design Language

A modern, bright, positive and businesslike visual system: *a sunny morning at a well-run river crossing*. Back to [[Portal Q&A]]. Voice: [[Brand and Tone of Voice]]. Implementation: Tailwind CSS with design tokens in both apps ([[Frontend Application]]).

> [!principle]
> Dignity in every pixel ([[Guiding Principles#P10. Dignity in every pixel]]). We show movement, competence and people acting together. We never show helplessness staged for emotion.

## Character

| We are | We are not |
|---|---|
| Bright, clear, generous white space | Grey, bureaucratic, dense |
| Warm (sunrise accent), human | Crisis red, alarm, sirens |
| Confident, businesslike (trustees trust it) | Cute, childish, cartoonish |
| Moving (flows, pulses) | Frantic (countdowns, flashing) |

## Palette

River blues and teals carry trust and flow. A warm **sunrise** accent carries hope and marks the one primary action on a screen.

| Token | Light | Dark | Use |
|---|---|---|---|
| `color.river.900` | `#0B3A53` | `#E6F3F8` | Headings, primary text on light |
| `color.river.600` | `#136F93` | `#4FB3D9` | Links, secondary actions, map corridors |
| `color.teal.500` | `#14A3A0` | `#3CCBC5` | Progress, success-in-motion, flow pulses |
| `color.teal.100` | `#DDF4F2` | `#0F3533` | Tinted panels |
| `color.sunrise.500` | `#F59E2B` | `#FFB54D` | Primary CTA ("Give"), highlights, gratitude |
| `color.sunrise.100` | `#FFF1DC` | `#3A2A12` | Gratitude cards |
| `color.sky.50` | `#F5FAFC` | `#0A1620` | Page background |
| `color.surface` | `#FFFFFF` | `#102230` | Cards |
| `color.ink.700` | `#2A3B47` | `#C9D6DE` | Body text |
| `color.attention.500` | `#C2410C` | `#FB923C` | Errors and real warnings only (burnt orange, not red) |
| `color.success.600` | `#15803D` | `#4ADE80` | Confirmed, delivered |

- Every text/background pair meets WCAG 2.2 AA (4.5:1 body, 3:1 large text and UI). Sunrise on white is used only for fills with `river.900` text, never as text colour. See [[Accessibility]].
- Status is never conveyed by colour alone. It always comes with an icon and a word.
- Dark mode follows `prefers-color-scheme` with a manual toggle, and all tokens are remapped.
- Organisation branding may replace `sunrise` with its own accent if the contrast validation passes (checked in [[Admin Studio]]).

## Typography

| Role | Typeface | Why |
|---|---|---|
| Display / headings | **Manrope** (Latin + Cyrillic) | Geometric, friendly, modern. Full Ukrainian coverage incl. ґ, є, і, ї |
| Body / UI | **Inter** (Latin + Cyrillic) | Excellent legibility at small sizes, tabular figures for ledgers |
| Numerals in data | Inter with `font-feature-settings: "tnum"` | Aligned columns in the [[Transparency Ledger]] |
| Fallback | `system-ui`, Noto Sans | For low-data mode and missing glyphs |

- Base size 17 px (18 px in the help-seeker flow), line height 1.55 and a maximum measure of 68 characters.
- Scale: 14 / 17 / 20 / 24 / 32 / 44 / 60.
- Fonts are self-hosted, subset per locale (Latin and Cyrillic subsets) and preloaded with `font-display: swap`. Low-data mode uses system fonts only.
- Ukrainian runs about 15–25 % longer than English. Components are designed for the longer string ([[Multilingual Experience]]).

## Motion principles

1. **Motion shows help moving.** Pulses along corridors, journey dots filling, counters rolling. These are the only "big" motions.
2. **Calm tempo.** Durations 150–600 ms. Easing `cubic-bezier(0.22, 1, 0.36, 1)` (gentle ease-out). Nothing loops forever.
3. **Never urgency.** No flashing, shaking, countdowns or "hurry" micro-copy.
4. **Once per view.** Entrance animations run once when scrolled into view.
5. **Respect the person.** `prefers-reduced-motion` reduces everything to 150 ms opacity fades. Low-data mode disables motion entirely.

Tokens: `motion.fast 150ms`, `motion.base 250ms`, `motion.slow 600ms`, `motion.stagger 120ms`. Implemented with Framer Motion. See [[Public Portal]] for the catalogue of motions.

## Illustration and photography

- **Illustration style**: flat, light line with soft fills in river and sunrise tones. It shows hands, vans, boxes, homes with lit windows, bridges and rivers. People are shown active (carrying, packing, talking) and diverse in age, with no stereotyped "victims".
- **Photography**: things and actions in preference to faces. Vans loading, generators running, a warm classroom from behind, hands passing a box. Faces appear only with a specific [[Consent]] for that use. Children's faces never appear. Uploads are EXIF-stripped, with optional face-blur ([[Media Asset]]).
- **Forbidden**: pity imagery, rubble as backdrop for fundraising, tears, "before/after" of people, giver-with-recipient "handover" photos staged for donors. See [[Ethics Charter]] and [[Recognition Anti-Patterns]].
- **Iconography**: 24 px rounded-stroke icons (Lucide-compatible) plus a set of need pictograms for [[Category]] tiles, tested for recognition by older users.

## Components

| Component | Notes |
|---|---|
| Button | Primary (sunrise fill), secondary (river outline), quiet (text). Min height 48 px on `web` |
| Card | 16 px radius, soft shadow `0 1px 2px / 0 8px 24px` at 6 % river-900 |
| Status pill | Icon + word + tint. Mapped to plain-words statuses ([[Help Seeker Section]]) |
| Journey dots | Five-step timeline (asked · gathered · carried · arrived · thanked) |
| Counter | Large tabular numeral + label + ⓘ definition link |
| Gratitude card | Sunrise-100 background, quote typography, language toggle |
| Stepper form | One group per step, progress "Step 2 of 4", always a back link |
| Data table | Zebra-free, row dividers, sticky header, tabular numerals |
| Toast / inline message | Never modal for success. Errors inline next to the field |

The studio uses the same tokens with denser spacing (`space.scale = compact`).

## Data visualisation

- Categorical palette in order: river-600, teal-500, sunrise-500, `#7C6FD6` (lilac), `#5B8C3A` (moss), ink-400 for "other". It is colour-blind safe as a sequence of up to 5 series.
- Money charts always show **costs next to income**, never income alone ([[Money Flow and Cost Transparency]]).
- Bars and stacked bars in preference to pies. Direct labels in preference to legends. Currency ISO code in the axis title.
- Maps: muted basemap, teal corridors, sunrise pulses. Settlements are rounded to oblast or city ([[Flow Map]]).
- Every chart has a text alternative ("Of GBP 4,200 raised, GBP 1,310 paid for transport…") and a "view as table" toggle.

## Design tokens

Tokens are defined once as JSON (W3C design-tokens format) in a shared package, then compiled to CSS variables and a Tailwind preset used by both `web` and `studio`.

```json
{
  "color": { "sunrise": { "500": { "$value": "#F59E2B" } } },
  "radius": { "card": { "$value": "16px" } },
  "motion": { "base": { "$value": "250ms" } },
  "space": { "unit": { "$value": "4px" } }
}
```

Organisation overrides are limited to accent colour, logo and hero illustration, and are validated for contrast.
