// route@1 — the acquirer that carries the attempt, under the terms and the
// strategy in force (after the portal's `chooseRoute` of ADR-0027): every
// connected acquirer is priced for this payment by part — the rate, or the
// on-us rate where the card's own bank acquires, plus the fixed part — and
// the strategy picks among those whose approval rate meets the floor. The
// answer records every alternative with its price and eligibility, so the
// decision is explainable after the fact and replays identically. The
// screening's `challenge` is carried as a top-level mark into the route
// answer, where the next knots' `where` rules read it.

import type { Acquirer, FunctionAnswer, Instrument, Invoice, Terms } from "../types";
import { at } from "../types";

export type Quote = { acquirer: string; bank: string; feeMinor: number; approvalBps: number; eligible: boolean; onUs: boolean };

export function quoteAcquirer(acquirer: Acquirer, amountMinor: number, onUs: boolean, minApprovalBps: number): Quote {
  const rateBps = onUs && acquirer.onUsBps !== undefined ? acquirer.onUsBps : acquirer.rateBps;
  const feeMinor = Math.round((amountMinor * rateBps) / 10_000) + acquirer.fixedMinor;
  return { acquirer: acquirer.id, bank: acquirer.bank, feeMinor, approvalBps: acquirer.approvalBps, eligible: acquirer.approvalBps >= minApprovalBps, onUs: onUs && acquirer.onUsBps !== undefined };
}

export function routeAt1(scope: Record<string, unknown>): FunctionAnswer {
  const invoice = at(scope, "attempt.invoice") as Invoice | undefined;
  const terms = at(scope, "attempt.terms") as Terms | undefined;
  const instrument = at(scope, "attempt.instrument") as Instrument | undefined;
  if (!invoice || !terms || !instrument) throw new Error("route@1: the scope holds no invoice, terms or instrument");
  const screening = at(scope, "attempt.screening") as { challenge?: unknown; result?: { challenge?: unknown } } | undefined;
  const challenge = screening?.challenge === true || screening?.result?.challenge === true;
  const issuer = terms.issuers.find((candidate) => instrument.bin.startsWith(candidate.bin)) ?? null;
  const quotes = terms.acquirers.map((acquirer) => quoteAcquirer(acquirer, invoice.amountMinor, issuer?.ownAcquirer === acquirer.id, terms.minApprovalBps));
  const eligible = quotes.filter((quote) => quote.eligible);
  if (eligible.length === 0) throw new Error(`route@1: no acquirer meets the approval floor of ${terms.minApprovalBps} bps`);
  const leastCost = [...eligible].sort((a, b) => a.feeMinor - b.feeMinor || b.approvalBps - a.approvalBps)[0];
  const bestApproval = [...eligible].sort((a, b) => b.approvalBps - a.approvalBps || a.feeMinor - b.feeMinor)[0];
  const ownBank = eligible.find((quote) => quote.onUs);
  let chosen = leastCost;
  let rule = "least cost among the eligible";
  if (terms.strategy === "approval_first") {
    chosen = bestApproval;
    rule = "highest approval among the eligible";
  } else if (terms.strategy === "on_us_first") {
    if (ownBank) {
      chosen = ownBank;
      rule = "the card's own bank, priced on-us";
    } else {
      rule = issuer?.ownAcquirer ? "the card's own bank is below the approval floor; least cost instead" : "no on-us acquirer for this card; least cost instead";
    }
  }
  return {
    result: {
      acquirer: chosen.acquirer,
      bank: chosen.bank,
      strategy: terms.strategy,
      rule,
      issuer: issuer ? { bin: issuer.bin, bank: issuer.bank } : null,
      onUs: chosen.onUs,
      expectedFeeMinor: chosen.feeMinor,
      minApprovalBps: terms.minApprovalBps,
      alternatives: quotes
    },
    marks: { challenge, acquirer: chosen.acquirer }
  };
}
