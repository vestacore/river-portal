---
type: adr
status: accepted
date: 2026-09-25
tags: [adr, licensing, publication]
spec: none
---

# ADR-0019 Licensing and Open Publication

## Context
The repository is published on GitHub for three purposes:
- as a **research project** in AI-driven software development;
- as a **free template** for civil-society organisations;
- as a way to draw attention to the situation in **Oleshky**, Kherson oblast.

The owner asked for:
- the portal code under **Apache 2.0**;
- the specification, decision records and process notes (the AI development framework) free for **non-commercial** use, with **commercial use by agreement**.

Two points in the request needed resolving. First, the portal was described as a "free MIT template", while the code is to be Apache 2.0. Second, the documentation licence was named as CC BY 4.0, but CC BY 4.0 **allows** commercial use, and CC licences do not permit additional restrictions.

## Decision
- **Code**: Apache License 2.0. This covers everything outside `spec/`, `adr/` and `meta/`: code, configuration, infrastructure, tools and screenshots. The root `LICENSE` holds the canonical text, `NOTICE` holds the attributions, and every `package.json` has `"license": "Apache-2.0"`. The README calls it a "free, open-source (Apache 2.0) template". Apache 2.0 is as free as MIT and adds an explicit patent grant.
- **`spec/`, `adr/`, `meta/`**: **CC BY-NC 4.0**, which matches the intent (non-commercial with attribution), plus **dual licensing**: commercial use, including using the materials as input to AI generation of commercial software, only under a separate written agreement (`LICENSE-DOCS.md`).
- **Contributions**: code is inbound = outbound under Apache 2.0. Contributors to the vaults license under CC BY-NC 4.0 and also grant the maintainers the right to include their contribution in commercial licences (`CONTRIBUTING.md`). Without that grant, dual licensing would stop working after the first outside contribution.
- **Oleshky fact sheet** (`docs/oleshky-fact-sheet.md`): **CC BY 4.0**, so journalists, NGOs and others can republish it freely.

## Consequences
- **Positive**: clear, standard licences that GitHub recognises (Apache 2.0 at the root); the AI framework stays open to civil society; commercial use funds or at least informs the maintainers.
- **Negative**: mixed licensing needs care when files move between the code and the vaults. The NC boundary can be ambiguous, so we invite questions. The contributor grant is a light CLA and should be reviewed by a lawyer before large outside contributions.
- **Open**: confirm the copyright holder name ("VestaCore and the River Portal contributors") and the commercial contact route.

## Alternatives considered
| Option | Why not |
|---|---|
| MIT for code | Equivalent freedom, but no patent grant; the owner specified Apache 2.0 |
| CC BY 4.0 for the vaults | Permits commercial use, which contradicts "commercial by agreement" |
| CC BY-NC-SA 4.0 | Share-alike would force derivatives to stay NC and open; possible later if wanted |
| A custom licence | Unfamiliar terms deter the organisations we want to reach |

Back to [[00 ADR Home]].
