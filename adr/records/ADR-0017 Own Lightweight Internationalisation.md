---
type: adr
status: accepted-provisional
date: 2026-09-24
tags: [adr, ui, i18n]
spec: spec/08-architecture/Internationalisation.md
---

# ADR-0017 Own Lightweight Internationalisation

## Context
The spec proposes next-intl. At launch we have two locales (en-GB, uk) and a small set of strings. Every dependency counts ([[ADR-0007 Dependency Supply-Chain Policy]]).

## Decision
- `@river/i18n` holds typed dictionaries (`en-GB`, `uk`), `translate`, formatters built on `Intl` (money, dates, plurals via `Intl.PluralRules`, which handles Ukrainian plural categories), and oblast names with grammatical cases (`gen`, `loc`) for pseudonymisation phrases.
- Routes are locale-prefixed: `/en-gb/...` and `/uk/...`. `proxy.ts` redirects `/` by `Accept-Language`, and a cookie remembers the choice.
- Content (blocks, reports, feed) stores per-locale fields `{ "en-GB": ..., "uk": ... }`.

## Consequences
- **Positive**: no dependency; types catch missing keys.
- **Negative**: ICU message syntax is not supported. We revisit next-intl if messages grow complex.

Back to [[00 ADR Home]].
