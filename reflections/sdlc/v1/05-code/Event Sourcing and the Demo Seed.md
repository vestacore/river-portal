---
type: reflection
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, code, events, seed]
---

# Event Sourcing and the Demo Seed

Back to [[00 SDLC Home]].

The portal writes every action as an event and derives every page from events (`adr/records/ADR-0011`, `ADR-0012`). The same architecture shapes the development cycle.

## The seed as an integration test
- The demo seed (`packages/compose/runtime/seedDemo.ts`) builds each profile's organisation **through the same commands the UI uses**. Each step is performed by the persona whose role it is:
  - Andriy coordinates;
  - Helen approves;
  - Mykola hands over;
  - Olena confirms;
  - Sofia publishes.

  Events are back-dated through the command context.
- **So every start exercises the domain:** commands, projections, capacities and privacy rules. `runtime.test.ts` runs the seed for all three profiles and checks:
  - the counters and the currency;
  - that no name, phone number, e-mail or village reaches a public document;
  - since iteration 04, that the demo can be walked: the carrier has a delivery on the way and the recipient has a request to confirm.
- **The seed has found a real rule.** In iteration 01 it tried to publish a report 13.8 days after a delivery, and the 14-day safety delay refused. The seed was changed, not the rule.

## The seed as the evaluation fixture
Profiles are compared on seeded data (see [[Parameterisation and Profiles]]), so the seed's *credibility* is part of quality:
- **The state programme showed a 73% delivery-cost share.** This was an artefact of scaling pounds into hryvnias: invisible to tests, obvious to a reader.
- **The seed does not simulate scale.** Every profile has the same six requests.

## Effects on the inner loop
- **The in-memory store lives in a runtime singleton.** After changing a projector or the seed, the dev server must restart; otherwise the old functions keep running on the old data. That happened three times in iteration 04.
- **Switching profile discards the demo data,** by design. Custom settings are lost with it.

## Lesson
A demo built by the product's own commands is both a fixture and a test. It needs **credibility checks** (does this number make sense for this kind of organisation?) as well as correctness checks.
