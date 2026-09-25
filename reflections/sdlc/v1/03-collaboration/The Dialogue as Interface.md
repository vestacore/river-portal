---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, dialogue]
---

# The Dialogue as Interface

Back to [[00 SDLC Home]].

## Three languages
- The owner directs in chat specific language.
- Every artefact is in **British English**: spec, ADRs, meta, code comments, README.
- The demo content is in **British English and Ukrainian**.

The AI translates between them. The goal sections of the iteration notes are where each translation is written down.

## The shape of a turn
| Owner | AI |
|---|---|
| A directive: goal, rules, check-in question | A short acknowledgement, if any |
| — | Work, with a brief progress line when the owner has been waiting a while |
| — | A closing summary: what was built, what was found, what needs the owner's decision |
| A terse acceptance: "Agreed, start …", "Already committed" | — |

## What makes it work
- **Trust within rules.** The owner fixes a few rules hard (supply chain, deployment, topology, language) and leaves the rest to judgement. The rules have held for 26 hours.
- **Screenshots as a shared language** for design: rounds R0–R4, then three profiles side by side.
- **Nearest variants instead of questions.** The AI asks only when the decision belongs to the owner. So far:
  - licensing ("MIT" or Apache 2.0; CC BY or non-commercial), recorded in ADR-0019;
  - whether "first contact within 48 hours" is a floor, and how to show the delivery-cost share, both recorded as open questions.

## Where it is fragile
- **Silent reinterpretation.** A misread directive is discovered only in the closing summary, after construction.
- **Volatile context.** A long iteration outgrows the context window; iteration 04 had one compaction. Anything that was not in a file or in the summary is lost.
- **Asymmetric bandwidth.** A 472-character directive returns 263 changed files (see [[Directive Amplification]]). The owner cannot read at the speed the AI writes.
