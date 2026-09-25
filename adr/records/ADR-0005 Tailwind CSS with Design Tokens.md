---
type: adr
status: accepted
date: 2026-09-24
tags: [adr, ui]
spec: spec/04-form/Design Language.md
---

# ADR-0005 Tailwind CSS with Design Tokens

## Context
The design must be modern, bright, positive and consistent (spec: Design Language), and be themable per organisation. We want minimal runtime CSS and minimal dependencies.

## Decision
- **Tailwind CSS 4.1** via `@tailwindcss/postcss`. Design tokens from the spec (river, teal, sunrise, sky, ink, attention) are declared once in `@theme` in `globals.css` as CSS variables, so an organisation theme is a variable override.
- An **own small component kit** in `apps/web/components/ui` (Button, Card, Badge, Progress, Field, Stat, Timeline). Accessible primitives from Radix are added **only when needed** (dialogs, menus), one package at a time.
- Motion: CSS transitions and keyframes, and the View Transitions API. No animation library yet.

## Consequences
- **Positive**: zero runtime CSS-in-JS; small bundles; tokens are one source of truth.
- **Negative**: we own the component kit's accessibility; this is checked against the spec's Accessibility note.

## Alternatives considered
| Option | Why not (now) |
|---|---|
| shadcn/ui wholesale | Pulls many Radix packages at once; we adopt its patterns, not its dependency set |
| Chakra / MUI / Mantine | Runtime styling cost; heavier; a generic look |
| Panda CSS / vanilla-extract | Good, but another build tool; Tailwind is enough |

## Amendment 2026-09-24
The visual decisions of this record (rounded corners, soft shadows, gradients, Inter and Manrope, wave motifs) are **superseded by [[ADR-0018 Drafting-Table Visual Language]]**. What remains in force: Tailwind CSS 4.1, design tokens in `@theme` as the single source of truth, and an own small component kit.

Back to [[00 ADR Home]].
