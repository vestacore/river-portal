---
type: iteration
status: review
date: 2026-09-24
tags: [iteration]
---

# Iteration 01 — Public Thread

Back to [[00 Meta Home]].

## Goal
The first **visible, end-to-end thread** through the system on the UI:

1. The public site: home with live counters, campaign, feed and "how it works"; bilingual (en-GB, uk).
2. **Ask for help** (`/ask`): a very simple form → tracking link.
3. **Track** (`/track/{token}`): status in plain words → confirm receipt and write thanks.
4. **Studio** (IAP; development identity locally): needs queue → acknowledge → open → match with a gift → dispatch with carrier and cost → mark delivered.
5. **Report**: generated privately from the flow's events → edited in place (Tiptap) → published publicly.
6. **Feed**: editors ask AI to turn the private report into short public snippets → edit and approve → published on the feed.
7. In-place editing of home page texts by editors.
8. Pulumi program for dev: load balancer, Cloud Armor WAF, IAP, Cloud Run ×2, Firestore, Artifact Registry, Cloud Build.

## Out of scope (next iterations)
Real payments, map, donor reports, partner organisations, multi-leg routes, photo uploads, notifications.

## Definition of done
- Runs locally with `npm run dev` on demo data, in both locales.
- `npm run check` passes: typecheck, topology and unit tests.
- `pulumi preview` succeeds for the `dev` stack.

## Log
- 2026-09-24: UI stack chosen (ADR-0004 … ADR-0006); dependency policy set (ADR-0007); topology defined (ADR-0002).
- 2026-09-24: Dependencies installed through `sfw`. The audit forced exceptions for Next.js and Tiptap ([[2026-09-24 Security Advisories Override the Version Rule]]).
- 2026-09-24: 14 packages written with gates; 15 unit tests, including the full thread and a check that no personal data reaches public documents.
- 2026-09-24: Web app: home, ask, track, give, campaign, report, feed, and the studio (needs, gifts, reports, feed). In-place editing with Tiptap.
- 2026-09-24: Walked through the whole thread in a browser: ask → triage → match → dispatch with multi-currency costs → deliver → confirm with thanks → private report → edit → publish (safety-delay acknowledgement) → AI suggestions → feed. Findings: [[2026-09-24 Framework Details Found by Running the UI]].
- 2026-09-24: Production build (standalone) passes. Pulumi program written; a scratch preview plans 34 resources (it stops only at cloud authentication).

## Status against the definition of done
- [x] Runs locally with `npm run dev` on demo data, in both locales
- [x] `npm run check` passes (typecheck, topology, tests)
- [ ] `pulumi preview` on the owner's `dev` stack (needs the owner's authentication)

