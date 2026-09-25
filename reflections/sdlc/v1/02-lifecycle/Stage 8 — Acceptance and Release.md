---
type: stage
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, stage, acceptance, release]
---

# Stage 8 — Acceptance and Release

Up: [[The Lifecycle as Observed]] · Previous: [[Stage 7 — Recording]] · Next: [[Stage 9 — Review and Re-vectoring]]

## Purpose
Decide that the work is good enough to keep (commit) and to run (deploy).

## What happens
- **The owner commits; the AI does not.** The working agreement says the AI commits only when asked, and it has not been asked. There are four commits so far (see [[Commit Style]]).
- **Acceptance evidence is compressed:**
  - the AI's closing summary;
  - screenshots (the home page in iteration 02, all three profiles in iteration 04);
  - check results;
  - the iteration note.

  Inference: the owner accepts on this evidence rather than by reading every diff. Iteration 04 was committed 2½ hours after the work ended, with 263 files in one commit.
- **The owner deploys.** The AI writes the Pulumi program and the owner runs `pulumi up`. Images are built by Cloud Build from within Pulumi (`adr/records/ADR-0014`). There is no CI/CD pipeline.

## Evidence
- *"Уже коммиттед"* ("Already committed") opened M5: acceptance is signalled in the dialogue.
- The owner split iterations 01–03 into two commits by concern, documentation and implementation, one minute apart.
- Iteration 01's definition of done left one box unticked: `pulumi preview` on the owner's stack needs the owner's credentials. The AI has not seen the deployed state of the cloud since.

## Weak spots
- **Acceptance is all or nothing for an iteration.** The owner cannot accept the settings registry and reject the studio layout, except by hand.
- **Release is invisible to the record.** Nothing in `meta/` says what is deployed where, or when.
- **Nothing checks the service after deployment.**

## Proposal
- A branch and a pull request per iteration, with commits per slice and the evidence in the description.
- A release log in `meta/releases/`.
- A smoke crawl after `pulumi up`.

See [[Deployment and Release]] and [[Commit and Branch Policy]].
