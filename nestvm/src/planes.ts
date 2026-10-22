// The PLANES — the door's projections across machines: orders, invoices,
// attempts and the ledger, folded from the committed logs of every session.
// A plane is a pure fold of tuples (Vol. 08 §8: a derived reading, never a
// second truth), keyed by (session, offset) so that mirroring is idempotent
// and rebuildable: drop the planes, fold every log again, and the same
// planes stand — the check `rebuildPlanes` runs. Inside a machine the
// machine's own readings serve (work-queue@1, publications@1); the planes
// exist because the readings are per session and the door must find which
// machine an invoice lives in. This is the mirror function of an observer
// (coagnes nestvm/mirrors/publication-mirror.md), pulled by offset after
// each commit rather than wired into the processor list — a committed
// tuple is the only thing it ever sees.

import type { Machines } from "./compose";
import { factOf } from "./types";
import type { WaveTuple } from "./types";

export type OrderRow = { orderId: string; session: string; unitId: string; merchantId: string; amountMinor: number; currency: string; payerRef: string; invoiceId: string | null; status: "created" | "invoiced" | "paid"; at: string };
export type InvoiceRow = { invoiceId: string; orderId: string; session: string; offset: number; amountMinor: number; currency: string; payerRef: string; dueAt: string; status: "issued" | "paid"; attempts: string[]; paidBy: string | null };
export type AttemptStage = "opened" | "screened" | "review" | "routed" | "challenged" | "authorised" | "captured" | "settled" | "declined" | "blocked" | "failed";
export type AttemptRow = { sessionId: string; invoiceId: string; stage: AttemptStage; waits: "review" | "challenge" | null; instrument: string | null; band: string | null; acquirer: string | null; onUs: boolean | null; expectedFeeMinor: number | null; feeMinor: number | null; paymentId: string | null; reason: string | null; lastOffset: number };
export type Posting = { session: string; offset: number; paymentId: string; account: string; debitMinor: number; creditMinor: number; currency: string };
export type Planes = { orders: Record<string, OrderRow>; invoices: Record<string, InvoiceRow>; attempts: Record<string, AttemptRow>; ledger: Posting[]; mirrored: Record<string, number> };

export function emptyPlanes(): Planes {
  return { orders: {}, invoices: {}, attempts: {}, ledger: [], mirrored: {} };
}

const str = (value: unknown, fallback = ""): string => (typeof value === "string" ? value : fallback);
const num = (value: unknown, fallback = 0): number => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

export function foldTuple(planes: Planes, session: string, tuple: WaveTuple): void {
  const fact = factOf(tuple);
  if (!fact) return;
  const data = fact.data;
  const result = (data.result ?? {}) as Record<string, unknown>;
  const attempt = planes.attempts[session];
  const touch = (patch: Partial<AttemptRow>): void => {
    if (!attempt) return;
    Object.assign(attempt, patch, { lastOffset: tuple.offset });
  };
  switch (fact.factType) {
    case "order.Created":
      planes.orders[str(data.orderId)] = { orderId: str(data.orderId), session, unitId: str(data.unitId), merchantId: str(data.merchantId), amountMinor: num(data.amountMinor), currency: str(data.currency), payerRef: str(data.payerRef), invoiceId: null, status: "created", at: str(data.at) };
      return;
    case "invoice.Issued": {
      if (data.represented !== undefined) {
        touch({ invoiceId: str(data.invoiceId) });
        return;
      }
      // The order machine's publication: the function host's delegated answer.
      const invoiceId = str(result.invoiceId);
      if (!invoiceId) return;
      planes.invoices[invoiceId] = { invoiceId, orderId: str(result.orderId), session, offset: tuple.offset, amountMinor: num(result.amountMinor), currency: str(result.currency), payerRef: str(result.payerRef), dueAt: str(result.dueAt), status: "issued", attempts: [], paidBy: null };
      const order = planes.orders[str(result.orderId)];
      if (order) {
        order.invoiceId = invoiceId;
        order.status = "invoiced";
      }
      return;
    }
    case "session.Opened": {
      const invoiceId = str(data.invoiceId);
      planes.attempts[session] = { sessionId: session, invoiceId, stage: "opened", waits: null, instrument: null, band: null, acquirer: null, onUs: null, expectedFeeMinor: null, feeMinor: null, paymentId: null, reason: null, lastOffset: tuple.offset };
      const invoice = planes.invoices[invoiceId];
      if (invoice && !invoice.attempts.includes(session)) invoice.attempts.push(session);
      return;
    }
    case "instrument.Chosen":
      touch({ instrument: `${str(data.instrument)} …${str(data.last4)}` });
      return;
    case "risk.Scored":
      touch({ stage: "screened", band: str(data.band, null as unknown as string) });
      return;
    case "review.Opened":
      touch({ stage: "review", waits: "review" });
      return;
    case "review.Cleared":
      touch({ waits: null });
      return;
    case "route.Chosen":
      touch({ stage: "routed", acquirer: str(result.acquirer), onUs: result.onUs === true, expectedFeeMinor: num(result.expectedFeeMinor) });
      return;
    case "authentication.Challenged":
      touch({ stage: "challenged", waits: "challenge" });
      return;
    case "authentication.Passed":
      touch({ waits: null });
      return;
    case "authorisation.Answered":
      if (data.outcome === "approved") touch({ stage: "authorised" });
      else touch({ reason: `${str(result.code)} ${str(result.reason)}`.trim() });
      return;
    case "capture.Answered":
      if (data.outcome === "captured") touch({ stage: "captured" });
      else touch({ reason: `${str(result.code)} ${str(result.reason)}`.trim() });
      return;
    case "attempt.Settled": {
      const paymentId = str(result.paymentId);
      touch({ stage: "settled", feeMinor: num(result.feeMinor), paymentId });
      for (const posting of (result.postings ?? []) as Record<string, unknown>[]) {
        planes.ledger.push({ session, offset: tuple.offset, paymentId, account: str(posting.account), debitMinor: num(posting.debitMinor), creditMinor: num(posting.creditMinor), currency: str(posting.currency) });
      }
      const invoice = planes.invoices[str(result.invoiceId)];
      if (invoice) {
        invoice.status = "paid";
        invoice.paidBy = session;
        const order = planes.orders[invoice.orderId];
        if (order) order.status = "paid";
      }
      return;
    }
    case "attempt.Declined":
      touch({ stage: "declined", waits: null });
      return;
    case "attempt.Blocked":
      touch({ stage: "blocked", waits: null });
      return;
    case "attempt.Failed":
      touch({ stage: "failed", waits: null });
      return;
    case "service.failed":
      touch({ stage: "failed", waits: null, reason: str(data.reason ?? data.error) });
      return;
    default:
      return;
  }
}

// Mirrors what a session committed beyond what the planes already hold — by offset, idempotent.
export function mirrorLog(planes: Planes, session: string, tuples: readonly WaveTuple[]): number {
  const from = planes.mirrored[session] ?? 0;
  let folded = 0;
  for (const tuple of tuples) {
    if (tuple.offset < from) continue;
    foldTuple(planes, session, tuple);
    planes.mirrored[session] = tuple.offset + 1;
    folded += 1;
  }
  return folded;
}

// The replay check: fold every stored log again from nothing.
export async function rebuildPlanes(machines: Machines): Promise<Planes> {
  const planes = emptyPlanes();
  const sessions = [...(await machines.sessions())].sort();
  // Order machines first, so that an attempt's invoice is known when its session is folded;
  // within one kind, by id — the same order the door opened them in.
  const logs = new Map<string, readonly WaveTuple[]>();
  for (const session of sessions) logs.set(session, await machines.log(session));
  const kind = (session: string): number => (logs.get(session)?.some((tuple) => factOf(tuple)?.factType === "order.Created") ? 0 : 1);
  for (const session of [...sessions].sort((a, b) => kind(a) - kind(b) || a.localeCompare(b))) mirrorLog(planes, session, logs.get(session) ?? []);
  return planes;
}

export function planesEqual(a: Planes, b: Planes): boolean {
  const strip = (planes: Planes): string => JSON.stringify({ orders: planes.orders, invoices: planes.invoices, attempts: planes.attempts, ledger: planes.ledger });
  return strip(a) === strip(b);
}

// Money is conserved: every settled payment's postings sum to zero.
export function ledgerBalanced(planes: Planes): boolean {
  const byPayment = new Map<string, number>();
  for (const posting of planes.ledger) byPayment.set(posting.paymentId, (byPayment.get(posting.paymentId) ?? 0) + posting.debitMinor - posting.creditMinor);
  return [...byPayment.values()].every((sum) => sum === 0);
}
