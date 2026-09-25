---
type: adr
status: accepted
date: 2026-09-25
tags: [adr, money, currency]
spec: spec/03-relationships/Money Flow and Cost Transparency.md
---

# ADR-0023 Reporting Currency and Recorded Conversion Rates

## Context
Until this iteration, every cost was converted into **pounds** at rates fixed in code, and totals were in GBP. The Ukrainian profiles (a state programme and a city foundation) work in **hryvnias**. Their donors, goals and public totals must be in UAH, while some costs are still paid in other currencies.

## Decision
- **Reporting currency.** `money.reportingCurrency` (a setting, ADR-0020) is the reporting currency. Pledges, campaign goals and every public total use it.
- **Recording a cost.** A cost is kept in the currency it was paid in, together with:
  - `fxRate`, the rate taken from `money.fxRates` at the moment of recording;
  - `reportingCurrency`;
  - `reportingMinor`, the converted amount.
- **Rates are recorded, not looked up later.** History never changes when rates change, and every total can be recomputed from the log.
- **A currency without a rate is refused** when a cost is recorded. A cost form offers only currencies that have a rate.
- **Thresholds are in the reporting currency.** The Lead Coordinator's approval limit (`money.costApprovalLimit`, DP-06) is compared with `reportingMinor`.
- **Field renames:** `gbpMinor` → `reportingMinor`, `costsGbpMinor` → `costsMinor`, `spentGbpMinor` → `spentMinor`. Reports record the `currency` of their facts.

## Consequences
- **Positive**
  - Each profile is coherent in its own currency.
  - The ledger is honest about the rate used.
  - Approvals follow the organisation's own threshold.
- **Negative**
  - Rates are entered by hand (TD-17).
  - Changing the reporting currency after money exists would mix currencies (TD-16).
  - In-kind gifts have no money value, so "share of money spent on delivery" can look high for transport fundraisers. The Transparency page says so.

## Alternatives considered
| Option | Why not |
|---|---|
| Keep GBP as the only reporting currency | Wrong for Ukrainian organisations; donors think in hryvnias |
| Look up rates at read time from a feed | History would change daily; needs a vendor; breaks reproducibility from the log |
| Multi-currency totals without conversion | Unreadable for the public; no single cost share or goal progress |

Back to [[00 ADR Home]].
