---
type: proposal
status: proposed
version: v1
date: 2026-09-25
tags: [sdlc, proposal, automation]
---

# Automation Backlog

Back to [[00 SDLC Home]]. Ordered by value for the effort.

| # | Item | Replaces | Effort | Value |
|---|---|---|---|---|
| A1 | **CI** running `npm run check`, the production build and `npm audit` on every push and pull request | Checks in the AI's session only | S | Very high |
| A2 | **Route crawl as a test:** each persona × each route → expected status | The ad hoc crawl script | S | High |
| A3 | **The walk as Playwright tests:** the ten steps of `/demo/walk` × 2 languages × 3 profiles | The AI's walk in the browser | M | Very high |
| A4 | **Screenshot matrix in one command** (profile × language × device), attached to pull requests | Ad hoc `design-shot` runs | S | High |
| A5 | **Vault checker** `tools/check-vaults.mjs`: links, wikilinks across vaults, frontmatter schema, complete home indexes | Checking by eye | S | High |
| A6 | **Generated numbers** for the README and the vault homes: notes, words, events, ADRs, tests | Counts kept by hand | S | Medium |
| A7 | **Traceability table** generated from `build:` fields in the spec, `spec:` fields in ADRs, and code comments | Nothing | M | Medium |
| A8 | **Dictionary lint:** currency symbols and hard-coded amounts. (Keys missing between languages are already caught by the types.) | Reading the pages | S | Medium |
| A9 | **Credibility assertions** on seeded figures for each profile (cost share, progress towards goals) | Reading screenshots | S | Medium |
| A10 | **Smoke crawl after deployment,** and a template for release notes | Nothing | S | High |
| A11 | **`sfw` in the container build** (TD-09), and pinned Pulumi plugins (TD-10) | `npm ci` | S | Medium |
| A12 | **SDLC metrics script** for [[Metrics to Watch]] | This vault's hand counts | M | Medium |
