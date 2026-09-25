---
type: proposal
status: proposed
version: v1
date: 2026-09-25
tags: [sdlc, proposal, checklists]
---

# Checklists

Back to [[00 SDLC Home]].

## Starting an iteration
- [ ] Restate the directive: goal, scope, out of scope, and the evidence the owner will receive
- [ ] List the proposed ADRs that need the owner's view (irreversible or outward-facing)
- [ ] Record new nearest-variant assumptions
- [ ] Create the iteration note skeleton, with the planned slices by layer
- [ ] Create the branch `iteration/NN-name`

## During construction
- [ ] Build bottom-up by layer, with `tsc` clean before moving up
- [ ] Commit each slice with a scope, a reason and `Refs:`
- [ ] Keep content data and the lockfile in their own commits
- [ ] Declare every new internal dependency, and run the topology check

## Verification
- [ ] `npm run check` and the production build
- [ ] Walk every role in both languages; the demo walk completes
- [ ] Crawl every route as each role, and compare with the designed matrix
- [ ] Screenshot matrix for every profile on desktop and phone, compared side by side
- [ ] Credibility of the seeded figures for each profile
- [ ] Independent review by a fresh-context agent

## Recording
- [ ] Iteration note: what was built, log, evaluation, what reads badly, what next
- [ ] Observations for anything surprising
- [ ] Registers: dependencies, debts (with triggers), assumptions, agreements
- [ ] ADRs with correct statuses and index entries; amendments noted on older ADRs
- [ ] Spec appendices and open questions; README and TOPOLOGY regenerated

## Acceptance and release
- [ ] A pull request with the evidence
- [ ] The owner merges
- [ ] The owner runs `pulumi up`; a release note; a smoke crawl
- [ ] Statuses updated (the iteration becomes `done`)

## Go-live gate (before real personal data)
- [ ] TD-01: per-person encryption and crypto-shredding
- [ ] TD-08: delayed aggregates and k-anonymity
- [ ] TD-15: real sign-in for public participants
- [ ] Policies reviewed by the person responsible for data protection; the complaints acknowledgement works (TD-22)
- [ ] A security review; observability in place
