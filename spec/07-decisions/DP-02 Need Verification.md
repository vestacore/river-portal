---
type: decision
status: draft
tags: [decision, need, trust, verification, tier/2, tier/3, privacy/sensitive, open-question]
aliases: [DP-02, Need Verification, Soundings]
related: ["[[Verification]]", "[[Need]]", "[[Reputation Signals]]"]
---

# DP-02 Need Verification

Back to [[Decision Points Overview]]. Roles: [[Responsibility Matrix]].

> [!principle] Proportionate soundings
> [[Guiding Principles#P2. A need is respected|P2]]: a need is taken at face value first. Verification is **proportionate to risk and to the value of what will move**. It exists to protect scarce resources and the recipient, not to test whether someone is "deserving".

## Question decided

*How deep a check is proportionate for this need, and has that check given enough confidence to route resources to it?*

## Trigger

- `need.Opened` (after [[DP-01 Need Triage]]), when the programme's verification policy requires more than the baseline.
- A match at [[DP-04 Matching]] that pushes the value committed above a risk threshold.
- New information: duplicate detection, a partner's alert, or an inconsistency found in delivery.

## Roles

| RACI | Role |
|---|---|
| **Decider (R)** | [[Coordinator]] assigned to the need |
| **Accountable (A)** | Lead Coordinator; the Safeguarding Lead for `sealed` needs |
| **Consulted (C)** | [[Partner Organisation]] or local institution (school, hromada office) acting as referee; Finance Steward above the value threshold |
| **Informed (I)** | [[Recipient]]: told what is checked, why, and what happens to the evidence |

## Inputs

| Input | Notes |
|---|---|
| Triage outcome, urgency, value band of likely help | From `need.Triaged` |
| Programme verification policy | Configuration in [[Admin Studio]]; versioned |
| [[Reputation Signals]] for the recipient (internal only) | Used **only** to choose depth: a strong history lowers the depth needed. A thin history never raises it above the policy baseline. |
| Evidence offered by the recipient or referee | Stored in `people/{personId}/private`, encrypted, with retention per [[Data Retention]] |
| Duplicate-detection hints | Same contact channel or address across needs. A hint, not a verdict. |

## Verification depths

The five depths are fixed in [[Canonical Parameters]] and described in [[Verification]].

| Depth | What it involves | Typical use |
|---|---|---|
| **V0 — Face value** | None beyond the triage conversation | Low-value items, urgent needs, institution-submitted needs |
| **V1 — Contact** | Call-back or message confirms the person and the delivery point | Standard goods |
| **V2 — Referee** | Confirmation by a known institution, partner or a second coordinator | Higher-value items, cash assistance |
| **V3 — Documentary** | Minimal documents, viewed not copied where possible ("seen, not stored") | Cash above threshold; restricted-fund conditions |
| **V4 — In person** | Field visit or in-person meeting by a known coordinator or partner; attestation and a short `private` note, no documents kept | Needs involving a minor or a safeguarding flag, decided by the Safeguarding Lead |

## Options and criteria

| Option | Effect | Criteria |
|---|---|---|
| Set depth (V0–V4) | `verification.DepthSet` | Policy baseline, then adjusted down for a strong history or urgency, and up only for value and restricted-fund rules |
| Verified | `verification.Completed { outcome: sufficient }` | The chosen depth is satisfied |
| Waived | `verification.Waived { reason }` | Urgent risk to health or life. Help is routed now and verification follows or is dropped. |
| Insufficient: change the form of help | `verification.Completed { outcome: insufficient }` + suggestion | Offer help in kind rather than cash, or delivery to an institution rather than a home. The need stays `open`. |
| Refer | `need.Referred` | A partner can verify and serve better |

## Outputs and events

`verification.Requested` · `verification.DepthSet` · `verification.EvidenceRecorded` { evidenceRef, seenNotStored } · `verification.Completed` · `verification.Waived`. Evidence references point into restricted storage and never into the event payload ([[Privacy Model]]).

## Guard-rails

1. A result of "insufficient" **never closes** the need and never blocks new needs. It changes the *form* or *route* of help.
2. No verification step may require public exposure, photos of the person's face, or proof of suffering.
3. Reputation may only *lower* the verification burden below the policy baseline, never raise it ([[Reputation Dynamics]]).
4. Evidence is collected once, for a stated purpose, and deleted or crypto-shredded on schedule ([[Data Minimisation]]).
5. Safeguarding disclosures go to the Safeguarding Lead and are not used as verification evidence.

## Reversibility and correction

A new `verification.Completed` supersedes the earlier one. If fraud is later established, `verification.Revoked` is appended with a reason, and open allocations go back to [[DP-04 Matching]]. The recipient is told, and can dispute it through [[Escalation and Disputes]].

## SLA target

V0: immediate. V1: same working day. V2: ≤ 3 working days. V3: ≤ 5 working days. V4: ≤ 10 working days, arranged with the Safeguarding Lead. If verification would delay an urgent need, the decider must use **Waived**.

## Escalation path

Coordinator → Lead Coordinator → Safeguarding Lead (sealed or at-risk) → Administrator. Suspected organised fraud is also recorded in the confidential channel in [[Escalation and Disputes#Whistleblowing channel]].

## Audit record

Depth chosen versus policy baseline, time to verify, and the share of needs verified at each depth. Auditors see counts and reasons, never evidence ([[Accountability and Audit]]).

> [!question] Open question
> Should V3 documentary checks be allowed at all for recipients in occupied or frontline areas, where possessing documents may itself be a risk? Proposed default: V3 is disabled for those areas and replaced by V2 via an institution. #open-question

## Related notes

[[Verification]] · [[Safeguarding]] · [[Lifecycle of a Need]] · [[Data Retention]] · [[Visibility Levels]]
