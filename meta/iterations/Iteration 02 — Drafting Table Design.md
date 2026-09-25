---
type: iteration
status: done
date: 2026-09-24
tags: [iteration, design]
---

# Iteration 02 — Drafting Table Design

Back to [[00 Meta Home]]. Decision: `adr/records/ADR-0018 Drafting-Table Visual Language.md`.

## Brief
Make the design **flat, modern and elegant, with straight bevelled lines, like pencil sketches on a technical drawing**. Iterate on the home page with explicit hypotheses until a stable version emerges. Judge it on aesthetics for the charity sector, on openness and on clarity.

## Method
- Each round: **hypothesis → change → full-page screenshots (desktop 1280, phone 390, en-GB and uk) → critique → scores**.
- Screenshots come from `tools/design-shot.mjs`: headless Chrome through the DevTools Protocol with real device emulation and a horizontal-overflow report. See [[2026-09-24 Screenshots Need Device Emulation]].
- **Rubric (1–5):** sector fit (warmth, dignity) · openness · clarity (hierarchy, obvious actions, readability) · fidelity to the brief · accessibility (contrast, sizes, phones, reduced motion).
- **Stop when** every score is at least 4, no critical issue is open, and the last round only refined details.

## Rounds

| Round | Hypothesis | Main changes | Sector | Open | Clear | Brief | Access |
|---|---|---|---|---|---|---|---|
| R0 | — (baseline) | Rounded pills, shadows, gradients, waves | 4 | 3 | 4 | 1 | 4 |
| R1 | A pencil-on-paper **drafting language** reads as "the plan is open", i.e. transparency, and stays warm through paper and one warm accent | Tokens (paper, graphite, blueline), radius and shadow tokens set to 0, IBM Plex Sans and Mono; `.sketch`, `.chamfer`, `.dim`, `.hatch`, `.paper-grid`; Fig. 1 river drawing; dimension counters; process line; ruler progress; title-block footer | 4 | 4 | 4 | 4 | 3 |
| R2 | The **bevel motif at the scale of sections** and warm plates add fidelity and warmth; a wider viewBox fixes the drawing's collisions | Bevelled plates for counters and thanks (sunrise); break lines on the channel; dimension line moved clear of the callouts; campaign facts 2×2; mobile step connector | 4.5 | 4 | 4.5 | 4.5 | 4 |
| R3 | **Pencil texture** (SVG turbulence) makes the lines more authentic; a larger drawing column adds impact | Texture tried, then **rejected** (invisible at 1:1, an artefact when zoomed); two-line callouts (term over meaning); balanced headline (`text-balance`); 3-item feed row; larger plate cuts (40 px) | 4.5 | 4.5 | 4.5 | 5 | 4.5 |
| R4 | Stability check: only polish should remain | Quotation marks by language (« » for Ukrainian); callout size 12.5; mobile connector moved clear of the text | 4.5 | 4.5 | 4.5 | 5 | 4.5 |

**Stopped after R4**: the stop criteria were met, and R4 contained no structural change.

## Consistency pass (all other pages)
Solid actions became bevelled fills, and outlined actions became straight frames or underlined links. Pills and gradients became flat paper, cards became sketch frames and tabs became underlined tabs. The timeline now has diamond nodes. The campaign page was redrawn as a sheet: graph-paper header, measuring scale, a plate of dimensions, and the cost breakdown in a sketch frame. Checked on ask, give, campaign, report, feed, track and the studio. `npm run check` and the production build pass.

## Findings worth keeping
- **Overshooting hairlines + one bevelled corner** read as a sketch without looking unfinished.
- **Numbers as dimensions** (value over a dimension line with oblique ticks) make statistics feel measured and honest, not promotional.
- **Warm plates for human voice** (thanks) balance the technical graphite. Warmth belongs where people speak.
- **Two-line callouts** (term / meaning) are clearer than one long label, and bilingual copy fits.
- **Rejected: jitter filters.** Authenticity comes from drafting conventions (overshoot, break lines, hatching, dimensions), not from noise.

## Follow-ups
- Dark theme as a "blueprint" inversion, with contrast checks.
- Consider per-organisation cut sizes and accent colour in the theme settings.
- Replace the remaining white studio surfaces with paper and sketch frames where it helps readability.
