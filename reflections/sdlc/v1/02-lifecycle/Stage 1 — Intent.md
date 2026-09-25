---
type: stage
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, stage, intent]
---

# Stage 1 — Intent

Up: [[The Lifecycle as Observed]] · Next: [[Stage 2 — Framing]]

## Purpose
Set the direction, the values and the constraints for the next piece of work.

## What happens
The owner writes one directive in Russian, of 334 to 3,298 characters. A directive usually has three parts:
1. **A goal**, often expressed as an image or a value:
   - "a river's channel, where separate banks and outflows carry what is needed to those who need it";
   - "a gift is a gift, not a commodity";
   - "access for those in need is always open".
2. **Rules**, stated precisely where they are non-negotiable:
   - "one public function, one file";
   - "access from one package to another only through the gate";
   - "you write, I run the deployment command (`pulumi up`)";
   - "nothing is changed by hand in Google Cloud";
   - "preferably minus two minor versions, installed through `sfw`".
3. **A check-in**: "Is everything clear?", "Do you agree with this meta structure?", "What do you, as a model, see in this field?"

## Evidence
- Seven directives in 25½ hours (see [[Timeline of Milestones]]).
- The engineering rules were stated once, in M2, and have held since (`meta/process/Working Agreements.md`).
- The owner specified the **architecture precisely and the UI loosely**. The UI was described by its qualities ("flat, modern, elegant, like pencil sketches on a drawing"), and the AI was trusted to find the form.

## Exit
There is no formal exit. The AI acknowledges briefly, if at all, and starts. Open questions do not block: the nearest sensible variant is taken and recorded (`meta/process/Nearest-Variant Assumptions.md`).

## Weak spots
- **The directive is the whole requirement.** Acceptance criteria stay implicit: "until you get a stable variant", "that is how we will test and evaluate".
- **Translation happens silently.** Russian intent becomes British English artefacts inside the AI, and nobody confirms the reading before construction starts.
- **Welcome but unplanned scope.** M6 took vectors V1, V4 and V5 from the review and added a settings registry with three profiles. That addition became the largest part of iteration 04.

## Proposal
Start every iteration with a short **restatement**: goal, scope, what is out of scope, the evidence the owner will receive, and the open assumptions. The owner can read it in a minute and redirect before construction starts. See [[SDLC v2 — Proposed Loop]].
