// settle@1 — the mouth: the captured amount is checked against the invoice,
// the fee is the route's expected fee under the terms, and the money is
// written as balanced postings — the acquirer's clearing, the acquirer's
// fee, the merchant's payable — in integer minor units. Money is conserved
// by construction: the postings sum to zero; a capture that does not match
// the invoice is refused here, never settled on a guess (ADR-0025's rule).

import type { FunctionAnswer, Invoice } from "../types";
import { at } from "../types";

export function settleAt1(scope: Record<string, unknown>): FunctionAnswer {
  const invoice = at(scope, "attempt.invoice") as Invoice | undefined;
  const capture = at(scope, "attempt.capture.result") as { capturedMinor?: number; reference?: string; currency?: string } | undefined;
  const route = at(scope, "attempt.route.result") as { acquirer?: string; expectedFeeMinor?: number; onUs?: boolean } | undefined;
  if (!invoice || !capture || !route) throw new Error("settle@1: the scope holds no invoice, capture or route");
  const captured = capture.capturedMinor ?? 0;
  if (captured !== invoice.amountMinor) throw new Error(`settle@1: the capture of ${captured} does not match the invoice of ${invoice.amountMinor}; nothing is settled on a guess`);
  const feeMinor = route.expectedFeeMinor ?? 0;
  const netMinor = captured - feeMinor;
  const acquirer = route.acquirer ?? "unknown";
  const postings = [
    { account: `clearing:${acquirer}`, debitMinor: captured, creditMinor: 0, currency: invoice.currency },
    { account: `fees:${acquirer}`, debitMinor: 0, creditMinor: feeMinor, currency: invoice.currency },
    { account: `payable:${invoice.merchantId}`, debitMinor: 0, creditMinor: netMinor, currency: invoice.currency }
  ];
  return {
    result: {
      paymentId: `pay-${capture.reference ?? invoice.invoiceId}`,
      invoiceId: invoice.invoiceId,
      orderId: invoice.orderId,
      merchantId: invoice.merchantId,
      acquirer,
      onUs: route.onUs === true,
      amountMinor: captured,
      feeMinor,
      netMinor,
      currency: invoice.currency,
      postings,
      receipt: { paid: captured, currency: invoice.currency, to: invoice.merchantId, reference: capture.reference ?? null }
    }
  };
}
