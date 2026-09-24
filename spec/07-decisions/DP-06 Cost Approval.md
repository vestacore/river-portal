---
type: decision
status: draft
tags: [decision, money, cost, ledger, tier/1, open-question]
aliases: [DP-06, Cost Approval, Toll Approval]
related: ["[[Cost Record]]", "[[Money Flow and Cost Transparency]]", "[[Transparency Ledger]]"]
---

# DP-06 Cost Approval

Back to [[Decision Points Overview]]. Roles: [[Responsibility Matrix]].

> [!principle] Honest numbers
> [[Guiding Principles#P8. Honest numbers, beautifully shown|P8]]: every toll the river pays is recorded, evidenced and shown. Costs are never hidden to make impact look bigger, and never inflated to absorb unrestricted funds.

## Question decided

*Is this [[Cost Record]] legitimate, evidenced, reasonable, and chargeable to the stated fund (restricted or unrestricted), so that it can enter the [[Transparency Ledger]]?*

## Trigger

DP-06 runs at three moments:
1. **Budget:** `leg.Planned` or `flow.Committed` with a budgeted cost (pre-approval).
2. **Actual:** `costRecord.Submitted` by a carrier, coordinator or hub lead with a receipt photo.
3. **Reconciliation:** at `flow.Confirmed` / before `flow.Closed`, to compare budget and actuals and confirm there are no orphan costs.

## Roles

| RACI | Role |
|---|---|
| **Decider (R)** | Lead Coordinator for costs ≤ the **approval threshold**. Finance Steward above it, or for any restricted fund. |
| **Accountable (A)** | Finance Steward |
| **Consulted (C)** | Carrier (to clarify a receipt); Sponsor for material changes to a restricted purpose |
| **Informed (I)** | Sponsors and givers, via the ledger at the next projection |

Threshold defaults from [[Canonical Parameters]] (an organisation may make them stricter in [[Admin Studio]], never looser): **GBP 250** (or equivalent), with a **four-eyes** rule at **GBP 1,000 or more**, which means two approvers, one of them the Finance Steward. See [[Accountability and Audit#Four-eyes rules]].

## Inputs

- Cost Record: type (fuel, toll, ferry, customs, packaging, postage, storage, other), amount, ISO currency, date, leg or flow, payer, and whether reimbursement is requested.
- Receipt [[Media Asset]], processed by the upload pipeline (EXIF stripped). AI OCR draft of amount, date and vendor (`via: vertex`, advisory). Recipient names on receipts are redacted before `team` view.
- FX rate at the event time (recorded, never recalculated later).
- Budget line and fund restrictions from [[Gift]]s allocated to the Flow.
- Rate card for reasonableness (e.g. fuel cost per km by vehicle class).

## Options and criteria

| Option | Event | Criteria |
|---|---|---|
| Approve | `costRecord.Approved` { fundId, approverIds[] } | Receipt legible, amount matches, reasonable against the rate card, within purpose |
| Query | `costRecord.Queried` { question } | Missing receipt, mismatch, unusual amount |
| Approve without receipt | `costRecord.Approved` { evidence: `declaration` } | Genuinely unobtainable (e.g. informal border fee). Capped per flow, with a signed declaration from the payer. |
| Reallocate fund | `costRecord.Reallocated` { fromFund, toFund } | A restricted fund cannot bear it. Moves to unrestricted. |
| Decline | `costRecord.Declined` { reason } | Not a flow cost, duplicate, or outside policy. The payer is told kindly, with the reason. |

## Outputs and events

`costRecord.BudgetApproved` · `costRecord.Approved` · `costRecord.Queried` · `costRecord.Declined` · `costRecord.Reallocated` · `costRecord.Reimbursed` { method, reference } · `flow.CostsReconciled` { budget, actual, variance, currency }. Only approved records project into the public [[Transparency Ledger]].

## Guard-rails

1. Nobody approves a cost they submitted or were reimbursed for. This is enforced by the command API.
2. Restricted funds cannot be used outside their purpose. Any reallocation is visible in the sponsor's [[Donor Report]].
3. Card data and bank details never enter the portal. Reimbursement references are recorded, not credentials ([[Money Flow and Cost Transparency]]).
4. AI OCR may pre-fill but never approve, and a mismatch between OCR and the human entry is highlighted.
5. Cost approval never affects whether a recipient is helped. It is about the ledger, not the need.

## Reversibility and correction

Approved costs are never edited. A mistake is corrected with `costRecord.Reversed` { reason } plus a new record. The ledger shows both lines, and corrections are visible in the public ledger as "corrected" entries.

## SLA target

Pre-approval: ≤ 1 working day (so vans are not held). Receipt approval: ≤ 5 working days. Reimbursement: ≤ 10 working days after approval. Reconciliation: before `flow.Reported`.

## Escalation path

Lead Coordinator → Finance Steward → Administrator → trustees (treasurer). Disputed costs: [[Escalation and Disputes#Cost disputes]].

## Audit record

Approval chain per cost, time to approve, declaration-only costs as a share of total, variance per flow, and FX rates used. Monthly reconciliation of external payment-provider statements against `gift.Received` and `costRecord.Reimbursed` ([[Accountability and Audit#Periodic reconciliation]]).

> [!question] Open question
> Should declaration-only costs (no receipt) be published line by line in the public ledger, or aggregated per flow to protect the payer? Proposed: aggregated, with a count. #open-question

## Related notes

[[Cost Record]] · [[Money Flow and Cost Transparency]] · [[Transparency Ledger]] · [[Sponsor]] · [[Leg]]
