---
type: process
status: draft
tags: [process, debt]
---

# Technical Debt Register

Shortcuts taken on purpose. Each has a trigger that says when it must be repaid. Back to [[00 Meta Home]].

| # | Debt | Why taken | Repay trigger | Severity |
|---|---|---|---|---|
| TD-01 | Per-person encryption of personal free text (crypto-shredding) not implemented | Speed to visible UI | **Before any real recipient data is stored** | High (hard gate) |
| TD-02 | Projections run synchronously in the command transaction | No Cloud Functions needed yet | Tier 3 volume or more than about 20 projections per event | Medium |
| TD-03 | Memory store driver is per-process | Local development and demo | Never deploy the memory driver in cloud (guarded by config) | Low |
| TD-04 | No hash chain on the event log | Not needed at Tier 1 | Auditor onboarding | Low |
| TD-05 | Role mapping for IAP identities is a static allow-list in config (`RIVER_STAFF_ROLES`, several roles per person since iteration 04) | One organisation, few staff | More than 10 staff or partner coordinators | Medium |
| TD-06 | No automated end-to-end tests yet | Speed | Before the first external demo | Medium |
| TD-07 | All pages render on demand (1–2 document reads each); no shared cache across instances | Simplicity; reads are already cheap | Traffic makes Firestore reads or latency noticeable — adopt `use cache` / Cache Components | Low |
| TD-08 | Public aggregates are not delayed by 72 hours (spec: Canonical Parameters) | Visible thread first | Before real deliveries in conflict zones | High (hard gate) |
| TD-09 | Docker build installs with `npm ci` (lockfile integrity, no scripts) but not through `sfw` | No sfw image yet | CI pipeline introduction | Medium |
| TD-10 | Pulumi downloads provider plugins itself | Pulumi CLI behaviour | Pin plugin versions in `Pulumi.yaml` `plugins` | Low |
| TD-11 | Money is recorded as pledges; no payment provider | Tier 1 nearest variant | Before real fundraising | Medium |
| TD-12 | IAP audience checked by project prefix, not the exact backend id (dependency cycle in Pulumi) | Backend id is only known after the service exists | Move the audience to Secret Manager and read it at start-up | Low |
| TD-13 | A custom `@media` rule in `globals.css` was dropped from the development CSS; worked around with Tailwind variants | Root cause not isolated | Next CSS change that needs custom media rules, or a Tailwind upgrade | Low |
| TD-14 | No dark theme yet (the drafting language is designed for light paper) | Scope | Accessibility review or owner request | Low |
| TD-15 | Public participants (recipients, givers, carriers) have no real sign-in; demo personas stand in for them (ADR-0021) | Walk every role first | **Before any real person uses "My river"** | High (hard gate) |
| TD-16 | The reporting currency can be changed after money exists; totals would mix currencies | Only demo data exists | Before real money: block the change, or record a conversion event | Medium |
| TD-17 | Conversion rates for costs are entered by hand in settings | Few currencies, few costs | Many costs in other currencies each month | Low |
| TD-18 | Labels of site texts in the studio are English only | Editors so far read English | A Ukrainian-speaking editor | Low |
| TD-19 | Tokens insert bare numbers, so "within {{help.replyWithinDays}} days" is wrong for 1 | Values are never 1 in the profiles | A value of 1, or a new locale with other plural rules | Low |
| TD-20 | Registered carriers are the demo personas; there is no people registry | Identity arrived before people management | The first real carrier | Medium |
| TD-21 | Profiles set parameters, not capabilities; the feature switchboard of Scaling Tiers is not in the registry | Parameters were asked for first | The next profile evaluation (state programme at scale) | Medium |
| TD-22 | The complaints policy promises an acknowledgement within one hour, which nothing sends yet | Policies written ahead of notifications | Before the policies are published for a real organisation | Medium |
