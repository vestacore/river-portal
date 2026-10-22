// The ACQUIRER'S STAND-IN — the bank played by the machine under the
// acquirer's own name (Vol. 08 §5: a deterministic controller double;
// record: controllers/acquirer-stand-in.yaml). It claims the authorisation
// and the capture requests and answers them as a function of the request's
// scope: the decision is read off the card's last four digits, so a story is
// told in the data and nowhere else. Every answer names itself a stand-in.
// A real acquirer's adapter is the same station reaching the bank; its
// answers re-enter as the same facts — but its discharge must be deferred
// beyond the request, which this library does not yet offer (the ADR's
// follow-ups).

import type { InstalledController } from "../../../../learning/coagnes/nestvm/lib/application/gate";
import type { FactPayload, Instrument, Invoice, ServiceRequest, WaveEmission, WaveTuple } from "../types";
import { at } from "../types";

export const ACQUIRER_STAND_IN_ID = "controller.acquirer.stand-in";

const INSTRUCTIONS = new Set(["authorise@1", "capture@1"]);

function requestOf(tuple: WaveTuple): ServiceRequest | null {
  if (tuple.kind !== "domain.fact") return null;
  const payload = tuple.payload as FactPayload;
  if (payload.factType !== "service.request") return null;
  return payload.data as ServiceRequest;
}

// A small deterministic code from a string — an authorisation code the bank would mint.
function code(seed: string): string {
  let h = 2_166_136_261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16_777_619);
  }
  return String(100_000 + ((h >>> 0) % 900_000));
}

function answer(tuple: WaveTuple, request: ServiceRequest, result: Record<string, unknown>, outcome: string, acquirer: string): WaveEmission {
  return {
    kind: "domain.fact",
    key: tuple.key,
    payload: {
      factType: String(request.emit?.writes),
      data: { bindId: request.bindId, uid: request.uid, result, by: { controller: ACQUIRER_STAND_IN_ID, acquirer, standIn: true }, outcome }
    }
  };
}

export function createAcquirerStandIn(): InstalledController {
  return {
    deterministic: true,
    label: "acquirer stand-in (no bank)",
    controller: {
      id: ACQUIRER_STAND_IN_ID,
      claims(tuple) {
        const request = requestOf(tuple);
        return request !== null && typeof request.emit?.writes === "string" && INSTRUCTIONS.has(request.instruction);
      },
      async discharge(tuple): Promise<readonly WaveEmission[]> {
        const request = requestOf(tuple)!;
        const scope = request.scope ?? {};
        const invoice = at(scope, "attempt.invoice") as Invoice | undefined;
        const instrument = at(scope, "attempt.instrument") as Instrument | undefined;
        const acquirer = String(at(scope, "attempt.route.result.acquirer") ?? at(scope, "attempt.route.acquirer") ?? "unknown");
        if (!invoice) {
          return [{ kind: "domain.fact", key: tuple.key, payload: { factType: "service.failed", data: { bindId: request.bindId, uid: request.uid, reason: "the stand-in was asked without an invoice in scope", by: { controller: ACQUIRER_STAND_IN_ID } } } }];
        }
        const last4 = instrument?.last4 ?? "0000";
        if (request.instruction === "authorise@1") {
          if (last4 === "0051") return [answer(tuple, request, { outcome: "declined", acquirer, reference: `auth-${invoice.invoiceId}`, code: "51", reason: "Insufficient funds" }, "declined", acquirer)];
          if (last4 === "0005") return [answer(tuple, request, { outcome: "declined", acquirer, reference: `auth-${invoice.invoiceId}`, code: "05", reason: "Do not honour" }, "declined", acquirer)];
          return [answer(tuple, request, { outcome: "approved", acquirer, reference: `auth-${invoice.invoiceId}`, authCode: code(`${acquirer}:${invoice.invoiceId}`), amountMinor: invoice.amountMinor, currency: invoice.currency }, "approved", acquirer)];
        }
        const authorisation = at(scope, "attempt.authorisation.result") as { reference?: string } | undefined;
        if (last4 === "0091") return [answer(tuple, request, { outcome: "failed", capturedMinor: 0, reference: authorisation?.reference ?? `auth-${invoice.invoiceId}`, code: "91", reason: "Issuer or switch inoperative" }, "failed", acquirer)];
        return [answer(tuple, request, { outcome: "captured", capturedMinor: invoice.amountMinor, currency: invoice.currency, reference: `cap-${invoice.invoiceId}`, authorisation: authorisation?.reference ?? null }, "captured", acquirer)];
      }
    }
  };
}
