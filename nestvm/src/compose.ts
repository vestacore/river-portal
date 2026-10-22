// The COMPOSITION ROOT of the lab — the one place where what the machines
// are made of is chosen (coagnes TOPOLOGY v5 §7, C1; nestvm/lib/entry): the
// document store (memory for the walk and the tests, files for the served
// door), the programme shelf (nestvm/programmes), the world (the function
// host and the acquirer's stand-in — no AI, no bank) and the atelier
// assembly, which installs every controller through the hold of the result
// contract. Everything below speaks the declared contract v1 only: acts
// (`actAssembleFigure`, `actApplyData`), readings (`readTrace`,
// `readWorkQueue`) and the engine's own HTTP handler for the machine's
// three roots.
//
// A MACHINE is a session: its programme is sown at birth (registration
// precedes the facts that reach it, Vol. 02 §5.1), through the records
// ingest — the laboratory liberty of the CoAgnes API (`records`, LIBERTY);
// the paradigm's authoring path is the loader station and admission.

import path from "node:path";
import { createEngine, handleRequest } from "../../../learning/coagnes/nestvm/lib/entry/gate";
import type { Engine, EngineRequest, EngineResponse, World } from "../../../learning/coagnes/nestvm/lib/entry/gate";
import { actApplyData, actAssembleFigure, describeWorld, readProgramme, readTrace, readWorkQueue } from "../../../learning/coagnes/nestvm/lib/application/gate";
import type { ActReceipt, DataFact } from "../../../learning/coagnes/nestvm/lib/application/gate";
import type { WaveTuple } from "./types";
import { createAcquirerStandIn } from "./world/acquirerStandIn";
import { createFunctionHost } from "./world/functionHost";

// The lab's root: this file is compiled to .dist/portal/nestvm/src/compose.js.
export const LAB_ROOT = path.resolve(__dirname, "../../../..");
export const PROGRAMMES_DIR = path.join(LAB_ROOT, "programmes");
export const STATE_DIR = path.join(LAB_ROOT, ".state");

export type Machines = {
  engine: Engine;
  world: World;
  classLine: string;
  // Opens a machine: a fresh session is sown with the named programme; a stored one continues.
  open(session: string, programme: string): Promise<{ fresh: boolean; sown?: ActReceipt }>;
  // Commits facts on the session's lane and settles the wave to quiescence — one request cycle.
  commit(session: string, facts: readonly DataFact[], commandId?: string): Promise<ActReceipt>;
  log(session: string): Promise<readonly WaveTuple[]>;
  queue(session: string): Promise<unknown>;
  sessions(): Promise<readonly string[]>;
  // The machine's own roots: /service, /ingest/{type}?session=, /projection/{contract}?session=.
  request(request: EngineRequest): Promise<EngineResponse>;
};

export async function composeMachines(options: { documents: "memory" | "files"; root?: string } = { documents: "memory" }): Promise<Machines> {
  const world: World = [createFunctionHost(), createAcquirerStandIn()];
  const engine = await createEngine({
    documents: options.documents,
    root: options.documents === "files" ? (options.root ?? path.join(STATE_DIR, "sessions")) : undefined,
    shelf: PROGRAMMES_DIR,
    world
  });
  return {
    engine,
    world,
    classLine: describeWorld(world),
    async open(session, programme) {
      await engine.touch(session);
      const watermark = await engine.app.host.watermark(session);
      if (watermark > 0) return { fresh: false };
      const records = readProgramme(programme, engine.app.programmes).records;
      const sown = await actAssembleFigure(engine.app, session, records);
      return { fresh: true, sown };
    },
    async commit(session, facts, commandId) {
      await engine.touch(session);
      return actApplyData(engine.app, session, facts, commandId ? { commandId } : {});
    },
    async log(session) {
      await engine.touch(session);
      return (await readTrace(engine.app, session)).tuples;
    },
    async queue(session) {
      await engine.touch(session);
      return readWorkQueue(engine.app, session);
    },
    sessions: () => engine.documents.sessions(),
    request: (request) => handleRequest(engine, request)
  };
}
