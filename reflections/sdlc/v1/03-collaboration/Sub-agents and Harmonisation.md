---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, agents]
---

# Sub-agents and Harmonisation

Back to [[00 SDLC Home]].

| When | Agents | Task | What had to be reconciled afterwards |
|---|---|---|---|
| Iteration 00 | 8 in parallel | One spec section each, from a shared brief and a fixed Vault Map | Numbers (k-anonymity of 3 or 5; four different safety delays); about 130 variant event names |
| Iteration 00 | 1 | Harmonise events and parameters | Created the single sources: Canonical Parameters and the Event Catalogue |
| Iteration 03 | 1 | Research the blockade of Oleshky | Key claims re-checked against four primary sources; the wording ("genocide" as the authors' stated position) decided by the main thread |
| Iteration 04 | 1 | Bilingual profile and page texts; demo variants | A district name in a public route label (privacy); thanks that mentioned "half of Europe" on a route inside Ukraine; a 73% cost share caused by scaled amounts |

## The pattern
1. **Fix the joins before splitting the work:** filenames (the Vault Map), types (`ProfileTexts`, `DemoVariant`), block identifiers.
2. **Let agents write content, not code.** The main thread integrates.
3. **Ask agents to report their assumptions.** The iteration 04 agent returned eleven "assumptions to check". Several became fixes (a bilingual legal name, a thanks text that fits each route, no district in a public label). Others became debts (TD-19, TD-22).
4. **Harmonise afterwards,** against the sources of truth and the privacy rules.

## Lessons
- **Parallel authoring is fast, and it drifts predictably,** in numbers, names and tone. The drift is cheap to fix when a harmonisation pass is planned, and expensive when readers find it.
- **Content is not neutral.** A route label or a thank-you note can break privacy or credibility. Reviewing content belongs to verification, not to proofreading.
