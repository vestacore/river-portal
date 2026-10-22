// invoice@1 — the payable claim of an order under the terms: a pure function
// of the order knot's scope. The invoice id derives from the order id and
// the due date from the order's own clock and the terms' time to live, so a
// replay issues the same invoice (the deterministic class, Vol. 08 §5).

import type { FunctionAnswer, Order, Terms } from "../types";
import { at } from "../types";

export function invoiceAt1(scope: Record<string, unknown>): FunctionAnswer {
  const order = at(scope, "order.order") as Order | undefined;
  const terms = at(scope, "order.terms") as Terms | undefined;
  if (!order || !terms) throw new Error("invoice@1: the scope holds no order or no terms");
  if (!Number.isInteger(order.amountMinor) || order.amountMinor <= 0) throw new Error("invoice@1: the order's amount is not a positive integer of minor units");
  const issuedAt = new Date(order.at);
  if (Number.isNaN(issuedAt.getTime())) throw new Error("invoice@1: the order carries no readable clock");
  const dueAt = new Date(issuedAt.getTime() + terms.invoiceTtlHours * 3_600_000);
  return {
    result: {
      invoiceId: `inv-${order.orderId}`,
      orderId: order.orderId,
      unitId: order.unitId,
      merchantId: order.merchantId,
      amountMinor: order.amountMinor,
      currency: order.currency,
      payerRef: order.payerRef,
      issuedAt: issuedAt.toISOString(),
      dueAt: dueAt.toISOString()
    }
  };
}
