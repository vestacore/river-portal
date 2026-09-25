---
type: adr
status: accepted
date: 2026-09-24
tags: [adr, ui, design]
spec: spec/04-form/Design Language.md
supersedes: parts of ADR-0005 (radii, shadows, gradients, fonts, motion)
---

# ADR-0018 Drafting-Table Visual Language

## Context
The owner asked for a design that is **flat, modern and elegant, with straight bevelled lines, like pencil sketches on a technical drawing**. It still has to suit the sector: a charity portal must feel warm, dignified, open and clear, never cold or bureaucratic. The first design (ADR-0005) used rounded pills, soft shadows, gradients, blur and wave motifs, which is the opposite of the brief.

The direction was found in an iterative loop of hypotheses, screenshots and scored critiques. It stopped when all scores were at least 4 of 5 and the last round changed only details. See the meta note *Iteration 02 — Drafting Table Design*.

## Decision
**Metaphor: the open plan.** The site reads as a sheet from a drawing set. Showing the plan is the visual form of our transparency principle: every line, measurement and cost is visible.

- **Tokens** (still Tailwind `@theme`, ADR-0005):
  - warm paper `#f7f5ef` and `paper-deep #efebe1`, graphite ink `#1c2228` / `#2a3137`, and non-photo-blue construction lines `#9ccbe0`;
  - one warm accent, sunrise `#f0962a`, for actions and human voice; teal `#13968f` for arrival and progress; river blue for ink details;
  - all radius tokens are 0 and shadow tokens are `none`; no gradients or blur.
- **Typography**: IBM Plex Sans for text and headings, and IBM Plex Mono for technical annotations (`.annot`: mono capitals, 0.72 rem, letter-spacing 0.12 em). Both cover Latin, Cyrillic and Ukrainian letters.
- **Drafting primitives** (plain CSS in `globals.css`):
  - `.sketch`: hairline frame whose lines overshoot the corners by 7 px, with a 16 px bevelled top-right corner;
  - `.chamfer`: flat fill with two bevelled corners. The fill is a pseudo-element, so keyboard focus outlines are never clipped;
  - `.dim`: dimension line with extension lines and oblique architectural ticks, used for every headline number;
  - `.hatch`: section hatching, used for "promised, not yet received";
  - `.paper-grid`: graph paper that fades out;
  - `.draw`: lines that draw themselves like a pencil (`pathLength="1"`).
- **Motifs**:
  - numbered sections (§ 01 …);
  - Fig. 1, the river as a technical drawing: channel with 45° bends, hatched banks, dash-dot centreline, gifts joining from the right, help leaving to the left, break lines, two-line callouts (term over meaning), and a dimension line "every step on record";
  - progress drawn as a measuring scale;
  - bevelled plates for counters and thanks;
  - the footer as the drawing's title block: "drawn by volunteers · checked by the people who received help".
- **Motion**: the pencil draw on load and one consignment gliding along the centreline. Under `prefers-reduced-motion` everything is static (`.motion-only` / `.still-only`).
- **Accessibility**:
  - body text at least 17 px; secondary annotations at least 11.5 px at 5.6 : 1 contrast on paper;
  - the drawing is `aria-hidden` and its callouts are hidden below 640 px, because the numbered steps carry the same meaning;
  - form fields stay white on paper with clear 1 px rings.

## Consequences
- **Positive**: a distinctive and coherent look that expresses openness. Flat CSS is light (no image assets). The same primitives style public pages and the studio.
- **Negative**: we maintain a handful of custom CSS primitives. Mono capitals must stay secondary and never carry essential information alone.
- **Follow-ups**: a dark theme ("blueprint" inversion) with contrast checks; tuning the cut sizes per organisation theme.

## Alternatives considered
| Option | Why not |
|---|---|
| Keep the rounded, soft style (ADR-0005) | Contradicts the brief |
| Classic blueprint (white lines on blue) | Cold, poor long-text readability; kept as an idea for a dark theme |
| Hand-drawn jitter filter on lines (tested in round 3) | Invisible at normal size, and looked like a rendering artefact when zoomed; crisp lines with overshoot read as a sketch more elegantly |
| A sharp-terminal display face (e.g. Geologica with its sharpness axis) | Not tested yet; Plex already carries the technical voice with full Ukrainian support |

Back to [[00 ADR Home]].
