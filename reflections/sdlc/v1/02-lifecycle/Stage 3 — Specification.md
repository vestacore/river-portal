---
type: stage
status: stable
version: v1
date: 2026-09-25
tags: [sdlc, stage, specification]
---

# Stage 3 — Specification

Up: [[The Lifecycle as Observed]] · Previous: [[Stage 2 — Framing]] · Next: [[Stage 4 — Decision]]

## Purpose
State *what* the product is and *why*: entities, relationships, decisions and responsibilities, publications, privacy and architecture.

## What happens
- **Iteration 00 wrote the whole specification before any code.** Today it has 146 notes, 138,283 words and 4,714 wikilinks, in twelve folders from `00-meta` to `99-templates`; all but a few hundred words date from iteration 00.
- **Eight sub-agents wrote the sections in parallel** from one brief and a Vault Map that fixed every filename.
- **A harmonisation pass** then reconciled the numbers and names that had drifted:
  - k-anonymity of 3 versus 5;
  - safety delays of 24 h, 72 h, 7 d and 14 d;
  - about 130 variant event names.

  The result was two sources of truth: `Canonical Parameters` and the `Event Catalogue` (361 events).
- **Later iterations change the spec only by addition:** dated sections ("Built so far (engineering iteration 04)", "Added in engineering iteration 04") and new open questions. Iteration 04 touched six spec notes (+95 lines) and rewrote none.

## Evidence
- **Domain rules in code cite the spec:**
  - cost approval is DP-06;
  - the floors come from Canonical Parameters, and the settings registry enforces the 14-day safety delay;
  - the twelve roles in `@river/identity` are the spec's roles.
- **The spec is far ahead of the code.** It describes `/map`, `/stories`, `/leg/{token}`, payments, Firebase sign-in, the consent registry and the audit explorer; none of these is built.

## Weak spots
- **Nothing in the spec says what is built.** A reader of `spec/` cannot tell what exists, except through the new "built so far" appendices.
- **Deviations are recorded only in prose.** For example, the studio has a locale prefix and is organised by river stage, not by the spec's routes.
- **No tool checks links, statuses or parameters** across the vault (see [[Obsidian Practice]]).

## Proposal
- Add a `build:` field to spec notes: `specified`, `partial`, `built` or `deviates`. The iteration that changes a note updates it.
- Generate a coverage table from those fields.
- Check the vault with a script, the way `tools/check-topology.mjs` checks the code.
