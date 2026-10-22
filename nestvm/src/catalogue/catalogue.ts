// The lab's CATALOGUE of pure functions — the same declared shape as the
// machine's own (coagnes nestvm/lib/application/catalogue.ts: lineage ·
// name · version · ref · station · kind · law, immutable by version), so
// that a journal can name which version of a rule decided, and a changed
// rule is a new `name@N` beside the old one, never an edit. These functions
// are reached at the membrane through the function host (Vol. 10 §9); a
// host cannot register bind actions of its own through the declared
// contract v1, which is why they stand here and not in the bind registry
// (see the ADR's findings).

import type { PureFunction } from "../types";
import { invoiceAt1 } from "./invoice";
import { routeAt1 } from "./route";
import { screenAt1 } from "./screen";
import { settleAt1 } from "./settle";

export type LabCatalogueEntry = Readonly<{
  lineage: string;
  name: string;
  version: number;
  ref: string;
  station: "discharge";
  kind: string;
  law: string;
  immutable: true;
  run: PureFunction;
}>;

function entry(lineage: string, name: string, version: number, kind: string, law: string, run: PureFunction): LabCatalogueEntry {
  return { lineage, name, version, ref: `${name}@${version}`, station: "discharge", kind, law, immutable: true, run };
}

export const LAB_CATALOGUE: readonly LabCatalogueEntry[] = [
  entry("8d2f1a6e-4c3b-4e9a-9f1d-2b7c5e0a3d41", "invoice", 1, "the payable claim of an order under the terms", "ADR-0026 §2 (the invoice boundary); Vol. 10 §9", invoiceAt1),
  entry("c7a9e3b1-5d2f-4b8c-a6e0-1f9d3c7b2e55", "screen", 1, "the attempt scored under the terms: band, score, reasons, challenge", "ADR-0026 §3 (psp-risk); Vol. 05 §3 (marks for where rules)", screenAt1),
  entry("f1b4d8c2-7e6a-4c3f-b9d1-8a2e5c7f4b63", "route", 1, "the acquirer under the strategy in force, every alternative priced", "ADR-0027 §5 (routing by approval and cost); Vol. 10 §9", routeAt1),
  entry("a3e7c5d9-2b1f-4a8e-8c6d-5f0b9e3a1c72", "settle", 1, "the mouth: fee under the terms, balanced postings, receipt", "ADR-0025 §5 (money is conserved); ADR-0026 §3 (psp-ledger)", settleAt1)
];

export function resolveLabFunction(ref: string): LabCatalogueEntry | null {
  return LAB_CATALOGUE.find((candidate) => candidate.ref === ref) ?? null;
}
