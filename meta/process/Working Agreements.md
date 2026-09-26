---
type: process
status: stable
tags: [process]
---

# Working Agreements

Back to [[00 Meta Home]].

| Area | Agreement | Recorded in |
|---|---|---|
| Language | Documentation, ADRs and meta notes in **British English**. Demo content in en-GB and Ukrainian. | spec Conventions |
| Deployment | Claude writes the Pulumi (TypeScript) program; **the owner runs `pulumi up`**. No manual changes in the Google Cloud console. | ADR-0008 |
| Interim showcase | A technical interim site on Vercel (Hobby) shows how and what the model built. Claude writes the steps, **the owner configures Vercel**; the portal code is not changed for it and stays aimed at Google Cloud. | ADR-0024, [[Interim Showcase on Vercel]] |
| Security at the edge | Cloud Armor Standard with WAF rules from day one. | ADR-0009 |
| Dependencies | Two minor lines behind latest; installed only with `sfw npm …`; exact pins; no install scripts. | ADR-0007, [[Dependency Register]] |
| Code structure | Functions in TypeScript; one public function per file; data structures in their own files; packages expose `gate.ts`; cross-package access only via gates; topology in `TOPOLOGY.md`. | ADR-0002, ADR-0003 |
| Pace | Ship **visible UI functionality as early as possible**; iterate and refine in cycles. | [[Iteration 01 — Public Thread]] |
| Open questions | Take the **nearest sensible variant**, record it, come back later. | [[Nearest-Variant Assumptions]] |
| Data | Firebase (Firestore) with reads optimised for fast pages. | ADR-0012 |
| Commits | Claude commits only when asked. | — |
| Design loops | Hypothesis → change → emulated screenshots (`tools/design-shot.mjs`) → scored critique; stop when every score is at least 4 and the last round only polished details | [[Iteration 02 — Drafting Table Design]] |
| Licensing | Code Apache 2.0; `spec/`, `adr/`, `meta/` CC BY-NC 4.0 with commercial use by agreement; Oleshky fact sheet CC BY 4.0 | ADR-0019 |
