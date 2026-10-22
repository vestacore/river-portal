// The lab's types, derived from the machine's declared contract v1 (the
// application gate and the entry gate of coagnes/nestvm/lib) — the portal
// speaks only that contract and never reaches into the machine's core
// (coagnes ADR-003: a contour calls only the protocol of its inner
// neighbour; nestvm/lib/API.md §1). Where the gate exports no type by name,
// it is derived from what the gate does export.

import type { InstalledController, readTrace } from "../../../learning/coagnes/nestvm/lib/application/gate";

export type OutputController = InstalledController["controller"];
export type WaveTuple = Awaited<ReturnType<typeof readTrace>>["tuples"][number];
export type WaveEmission = Awaited<ReturnType<OutputController["discharge"]>>[number];

// The open fact shape (Vol. 04 §3.1) and the service intention the membrane sweeps (Vol. 04 §5.1).
export type FactPayload = { factType: string; data: Record<string, unknown> };
export type ServiceRequest = {
  bindId: string;
  uid: string;
  instruction: string;
  scope?: Record<string, unknown>;
  schema?: unknown;
  emit?: { writes?: string };
};

export function factOf(tuple: WaveTuple): FactPayload | null {
  if (tuple.kind !== "domain.fact") return null;
  const payload = tuple.payload as FactPayload;
  return typeof payload.factType === "string" ? payload : null;
}

// What a pure function of the catalogue gives back: the result the bind's
// schema fixes, and the marks it declares at the top level of the answer
// for the next knots' `where` rules (the convention of the CoAgnes landing's
// own routing case: the band stands beside bindId and uid).
export type FunctionAnswer = { result: Record<string, unknown>; marks?: Record<string, unknown> };
export type PureFunction = (scope: Record<string, unknown>) => FunctionAnswer;

// The assembly's terms — the policies the machines work under, written into
// every machine at its birth as `terms.given` (assembly/terms.json).
export type Acquirer = { id: string; bank: string; rateBps: number; fixedMinor: number; onUsBps?: number; approvalBps: number };
export type Issuer = { bin: string; bank: string; ownAcquirer: string | null };
export type Terms = {
  unitId: string;
  merchantId: string;
  currency: string;
  invoiceTtlHours: number;
  strategy: "least_cost" | "on_us_first" | "approval_first";
  minApprovalBps: number;
  screening: { reviewAtMinor: number; blockAtMinor: number; challengeAboveMinor: number; blockedPayers: readonly string[] };
  acquirers: readonly Acquirer[];
  issuers: readonly Issuer[];
};

export type Order = { orderId: string; unitId: string; merchantId: string; amountMinor: number; currency: string; payerRef: string; lines: readonly { sku: string; qty: number; priceMinor: number }[]; at: string };
export type Invoice = { invoiceId: string; orderId: string; unitId: string; merchantId: string; amountMinor: number; currency: string; payerRef: string; issuedAt: string; dueAt: string };
export type Instrument = { sessionId: string; instrument: "card"; bin: string; last4: string; at: string };

export const at = (scope: Record<string, unknown>, path: string): unknown => {
  let here: unknown = scope;
  for (const step of path.split(".")) {
    if (here === null || typeof here !== "object") return undefined;
    here = (here as Record<string, unknown>)[step];
  }
  return here;
};
