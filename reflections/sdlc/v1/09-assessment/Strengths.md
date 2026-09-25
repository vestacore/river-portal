---
type: assessment
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, assessment, strengths]
---

# Strengths

Back to [[00 SDLC Home]].

| Strength | Evidence |
|---|---|
| **A specification before code** gave the AI a domain to reason in | Rules in code cite spec identifiers (DP-06, floors); roles, events and the site map come from the spec |
| **The topology makes AI-written code reviewable by rule** | 10 checks, 0 violations; the 17 gates are an index of the whole API |
| **Decisions and lessons are written down, mistakes included** | 23 ADRs; 7 observations; a 13-row defect table in iteration 04 |
| **Open questions never block** | 16 nearest-variant assumptions and 22 debts, each with a trigger |
| **Verification goes beyond the tests** | The walk, the crawl and the screenshot matrix found 13 defects after the tests had passed |
| **Fast construction** | About 4 hours of AI time for a specification, 17 packages, a bilingual web app and studio, the infrastructure and 23 ADRs |
| **Values enacted in the process** | Privacy tests on public documents; an honest evaluation ("what reads badly"); the owner's positions recorded as positions |
| **Clear responsibility** | The owner accepts and deploys; the AI never commits or deploys unasked |
| **Supply-chain discipline** | `sfw`, exact pins, advisories overriding the version rule, a clean audit; no new dependency in iteration 04 |
