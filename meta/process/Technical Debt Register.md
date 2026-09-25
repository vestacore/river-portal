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
| TD-05 | Role mapping for IAP identities is a static allow-list in config | One organisation, few staff | More than 10 staff or partner coordinators | Medium |
| TD-06 | No automated end-to-end tests yet | Speed | Before the first external demo | Medium |
| TD-07 | All pages render on demand (1–2 document reads each); no shared cache across instances | Simplicity; reads are already cheap | Traffic makes Firestore reads or latency noticeable — adopt `use cache` / Cache Components | Low |
| TD-08 | Public aggregates are not delayed by 72 hours (spec: Canonical Parameters) | Visible thread first | Before real deliveries in conflict zones | High (hard gate) |
| TD-09 | Docker build installs with `npm ci` (lockfile integrity, no scripts) but not through `sfw` | No sfw image yet | CI pipeline introduction | Medium |
| TD-10 | Pulumi downloads provider plugins itself | Pulumi CLI behaviour | Pin plugin versions in `Pulumi.yaml` `plugins` | Low |
| TD-11 | Money is recorded as pledges; no payment provider | Tier 1 nearest variant | Before real fundraising | Medium |
| TD-12 | IAP audience checked by project prefix, not the exact backend id (dependency cycle in Pulumi) | Backend id is only known after the service exists | Move the audience to Secret Manager and read it at start-up | Low |
| TD-13 | A custom `@media` rule in `globals.css` was dropped from the development CSS; worked around with Tailwind variants | Root cause not isolated | Next CSS change that needs custom media rules, or a Tailwind upgrade | Low |
| TD-14 | No dark theme yet (the drafting language is designed for light paper) | Scope | Accessibility review or owner request | Low |
