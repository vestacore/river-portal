// The FUNCTION HOST — a deterministic controller at the membrane (Vol. 07
// §2; Vol. 10 §9: "operator binds discharged by a deterministic
// function-host controller — the service instruction names the function;
// the schema fixes its result"; record: controllers/function-host.yaml).
// It claims a `service.request` whose instruction is a reference of the
// lab's catalogue, runs the pure function over the request's bound scope
// (the intention is machine-complete, Vol. 06 §4.4) and publishes the result
// by proxy under the bind's own emit declaration (Vol. 04 §5.3), with the
// function's declared top-level marks beside the correlation. A thrown
// function is an expected failure: `service.failed`, correlated, with the
// reason (Vol. 07 §2.4). The result contract is held by the assembly, which
// installs every controller through `holdResultContract`.

import type { InstalledController } from "../../../../learning/coagnes/nestvm/lib/application/gate";
import { resolveLabFunction } from "../catalogue/catalogue";
import type { FactPayload, ServiceRequest, WaveEmission, WaveTuple } from "../types";

export const FUNCTION_HOST_ID = "controller.function-host";

function requestOf(tuple: WaveTuple): ServiceRequest | null {
  if (tuple.kind !== "domain.fact") return null;
  const payload = tuple.payload as FactPayload;
  if (payload.factType !== "service.request") return null;
  return payload.data as ServiceRequest;
}

export function createFunctionHost(): InstalledController {
  return {
    deterministic: true,
    label: "function host (the lab's catalogue)",
    controller: {
      id: FUNCTION_HOST_ID,
      claims(tuple) {
        const request = requestOf(tuple);
        return request !== null && typeof request.emit?.writes === "string" && resolveLabFunction(request.instruction) !== null;
      },
      async discharge(tuple): Promise<readonly WaveEmission[]> {
        const request = requestOf(tuple)!;
        const fn = resolveLabFunction(request.instruction)!;
        const correlation = { bindId: request.bindId, uid: request.uid };
        const by = { controller: FUNCTION_HOST_ID, function: fn.ref };
        try {
          const answer = fn.run(request.scope ?? {});
          return [
            {
              kind: "domain.fact",
              key: tuple.key,
              payload: { factType: String(request.emit?.writes), data: { ...correlation, result: answer.result, by, ...(answer.marks ?? {}) } }
            }
          ];
        } catch (error) {
          return [
            {
              kind: "domain.fact",
              key: tuple.key,
              payload: { factType: "service.failed", data: { ...correlation, reason: error instanceof Error ? error.message : String(error), by } }
            }
          ];
        }
      }
    }
  };
}
