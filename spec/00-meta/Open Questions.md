---
type: meta
status: draft
tags: [meta, open-question]
---

# Open Questions

Unresolved questions collected from across the vault. Each entry links to the note where it arose and gives the **current proposal**, if one exists. To resolve a question, write an ADR or update the note and [[Canonical Parameters]], then tick it here. Back to [[00 Home]].

## Resolved during structuring
- [x] ~~Does Tier 1 handle money directly?~~ **No.** Tier 1 uses external payment links, and provider webhooks append `gift.Received`. Card data never touches the portal. See [[Money Flow and Cost Transparency]].
- [x] ~~Minimum age for a self-registered recipient?~~ **18.** People aged 16–17 ask through a trusted adult or institution. See [[Canonical Parameters]] and [[Safeguarding]].
- [x] ~~Can a giver be anonymous to the coordinator?~~ **Yes**, below GBP 5,000 in 12 months and without Gift Aid. See [[Canonical Parameters]] and [[Giver]].
- [x] ~~How reputation is shown to its subject~~ **Both:** a short narrative and the signals behind it. See [[Reputation]] and [[Reputation Signals]].

## Business and ethics
- [ ] **Sponsor logos and P1.** Proposal: shown only with consent, all at the same size, and never next to recipient content. — [[Sponsor]]
- [ ] **In-kind goods valued in money.** Needed for the metric of costs against gifts, but it risks putting price tags on things. — [[Impact Metrics]]
- [ ] **Gift Aid and recurring gifts** (Tier 2 and up): a declaration record plus an HMRC export? Out of scope for the Donor Report PDF? — [[Money Flow and Cost Transparency]], [[Donor Report]]
- [ ] **Refunds of pooled money** after part of it has been allocated. — [[Portal Q&A]]
- [ ] **Dual-use items** (generators, tourniquets, vehicles): where is the line for a civilian charity? — [[Ethics Charter]]
- [ ] **Can givers reply to a gratitude note?** Proposal: only if the recipient opts in. — [[Gratitude Loop]]
- [ ] **Can a partner organisation be Lead Coordinator** of a flow? Current model: no. — [[Coordination Model]]
- [ ] **Tier 1 self-approval at DP-10.** Proposal: allowed, logged and disclosed in the Impact Report. — [[Publication Pipeline]]

## Privacy, safeguarding and law
- [ ] **Verbal consent** recorded by a coordinator: is it enough for an identifiable photo, or should the person confirm by SMS? — [[Consent]]
- [ ] **Age of digital consent** across jurisdictions. Current rule: under 18 is treated as a child for publication. — [[Consent Management]]
- [ ] **Ukraine's GDPR-aligned law**: review the lawful-basis table when it is adopted. — [[Privacy Model]]
- [ ] **Data residency in Ukraine** that some partners may require. — [[Data Retention]]
- [ ] **Moving events to a sealed archive bucket**: does it break the no-delete rule? Needs an ADR. — [[Data Retention]]
- [ ] **Administrator break-glass access to `sealed` data.** Current default: no. — [[Admin Studio]], [[Administrator]]
- [ ] **V3 documentary checks in occupied or frontline areas.** Proposal: switched off, with an institution acting as referee instead. — [[DP-02 Need Verification]]
- [ ] **Costs without a receipt**: what evidence standard and cap, and should the public ledger group them? Proposal: grouped per flow, with a count. — [[Cost Record]], [[DP-06 Cost Approval]]
- [ ] **Hosting the whistleblowing channel** outside the organisation's GCP project. — [[Escalation and Disputes]]
- [ ] **Reputation across tenants** (Tier 4). Proposal: shared only with a `reputation_portability` consent. — [[Reputation]]
- [ ] **Live location for volunteer carriers.** Proposal: no, only coarse checkpoints. — [[Transport and Logistics Flow]]

## Product and UX
- [ ] **Russian-language intake page** as an option for organisations. Default: no Russian interface, but free text in any language is accepted. — [[Multilingual Experience]]
- [ ] **Map tile provider**, and handling changes to oblast boundaries. — [[Flow Map]]
- [ ] **Category alignment** with humanitarian cluster or sector codes for exchange with partners. — [[Category]]

## Technology
- [ ] **Framework**: Next.js, Nuxt or Astro. To be settled by a test of the `/ask` bundle on a mid-range Android phone. — [[ADR-004 Next.js on Cloud Run]]
- [ ] **BigQuery export** from day one or from Tier 3; is the per-organisation hash chain worth it below Tier 3? — [[Event Log and Projections]]
- [ ] **Hash chain throughput at Tier 4**: one chain per organisation, or a chain per aggregate with a daily Merkle root. — [[Accountability and Audit]]
- [ ] **Multi-tenancy.** Proposal: shared hosting for Tier 1–2, a dedicated project for Tier 3–4. — [[Scaling Architecture]]
- [ ] **Vertex v1 scope.** Proposal: translation drafts and PII detection first, then summaries and receipt reading, then matching and report drafting. — [[Vertex AI Integration]]
- [ ] **Offline scope**: drafting only, or confirmation with photos uploaded later, plus an SMS fallback. — [[Help Seeker Section]], [[Frontend Application]]
