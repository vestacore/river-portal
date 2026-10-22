// screen@1 — the attempt scored under the terms: a band (pass · review ·
// block), a score with its reasons, and whether a challenge is due. The
// thresholds are the terms', never the function's: a change of policy is a
// new `terms.given`, not a new version of this function. The band and the
// challenge are declared as top-level marks so that the next knots' `where`
// rules can read them (Vol. 05 §3) — the comparison lives here, at the
// membrane, where a surface can read the controller's record.

import type { FunctionAnswer, Instrument, Invoice, Terms } from "../types";
import { at } from "../types";

export function screenAt1(scope: Record<string, unknown>): FunctionAnswer {
  const invoice = at(scope, "attempt.invoice") as Invoice | undefined;
  const terms = at(scope, "attempt.terms") as Terms | undefined;
  const instrument = at(scope, "attempt.instrument") as Instrument | undefined;
  if (!invoice || !terms || !instrument) throw new Error("screen@1: the scope holds no invoice, terms or instrument");
  const { reviewAtMinor, blockAtMinor, challengeAboveMinor, blockedPayers } = terms.screening;
  const reasons: string[] = [];
  let score = Math.min(100, Math.round((invoice.amountMinor / blockAtMinor) * 60));
  if (invoice.amountMinor >= reviewAtMinor) reasons.push("amount");
  if (blockedPayers.includes(invoice.payerRef)) {
    reasons.push("payer");
    score = 100;
  }
  if (instrument.instrument !== "card") {
    reasons.push("instrument");
    score = Math.min(100, score + 10);
  }
  const band = score >= 100 || invoice.amountMinor >= blockAtMinor ? "block" : invoice.amountMinor >= reviewAtMinor ? "review" : "pass";
  const challenge = instrument.instrument === "card" && invoice.amountMinor > challengeAboveMinor;
  return {
    result: { band, score, reasons, challenge, thresholds: { reviewAtMinor, blockAtMinor, challengeAboveMinor } },
    marks: { band, challenge }
  };
}
