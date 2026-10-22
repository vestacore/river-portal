// ROUTING OF FACTS — which machine a fact belongs to, decided from the
// planes by the domain's own rule: an order is a machine of its own; an
// attempt to pay an invoice is a machine of its own, born with the invoice
// re-presented from the order machine's publication; a fact about an
// attempt (the payer's authentication, a reviewer's decision) goes to the
// attempt's machine and to no other. The router never writes: it names the
// session and the programme, and refuses an id the planes do not know.
// Facts cross a machine boundary only as content stamped with its origin
// (`represented: {session, offset}`), never as a tuple of another log.

import type { Planes } from "./planes";

export type Route =
  | { ok: true; session: string; programme: "order" | "payment-attempt"; fresh: boolean; context?: { invoice: { session: string; offset: number } } }
  | { ok: false; error: string };

export function routeOrder(orderId: string): Route {
  return { ok: true, session: orderId, programme: "order", fresh: true };
}

export function routeAttempt(planes: Planes, invoiceId: string, attemptId: string): Route {
  const invoice = planes.invoices[invoiceId];
  if (!invoice) return { ok: false, error: `the planes know no invoice '${invoiceId}'` };
  if (invoice.status === "paid") return { ok: false, error: `invoice '${invoiceId}' is paid by ${invoice.paidBy}; nothing more may be attempted on it` };
  if (planes.attempts[attemptId]) return { ok: false, error: `attempt '${attemptId}' already exists` };
  return { ok: true, session: attemptId, programme: "payment-attempt", fresh: true, context: { invoice: { session: invoice.session, offset: invoice.offset } } };
}

export function routeAttemptFact(planes: Planes, attemptId: string, expectedWait: "review" | "challenge"): Route {
  const attempt = planes.attempts[attemptId];
  if (!attempt) return { ok: false, error: `the planes know no attempt '${attemptId}'` };
  if (attempt.waits !== expectedWait) return { ok: false, error: `attempt '${attemptId}' does not wait for a ${expectedWait} (stage ${attempt.stage}${attempt.waits ? `, waits for ${attempt.waits}` : ""})` };
  return { ok: true, session: attemptId, programme: "payment-attempt", fresh: false };
}
