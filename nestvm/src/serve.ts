// THE SERVED DOOR — the lab's REST API over machines stored as files under
// nestvm/.state/sessions (the request cycle without residency: each gesture
// loads a machine at its watermark, settles, commits one atomic movement
// and discards it). Domain roots shape facts for machines; the machine's
// own three roots are mounted under /machine for anyone who wants the raw
// readings (trace-film@1, work-queue@1, publications@1 …). The planes are
// rebuilt from the stored logs at start and compared with the planes last
// written — the replay check, at every start.
//
//   POST /orders                         {amountMinor, currency?, payerRef, lines?}
//   POST /invoices/{id}/attempts         {bin, last4}
//   POST /attempts/{id}/authentication   {outcome: passed | failed}
//   POST /attempts/{id}/review           {decision: clear | block, actor}
//   GET  /planes · /planes/{orders|invoices|attempts|ledger}
//   GET  /machines · /machines/{id}/log · /machines/{id}/queue
//   ANY  /machine/service/… · /machine/ingest/{type}?session= · /machine/projection/{contract}?session=
//   GET  /ready

import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { composeMachines, STATE_DIR } from "./compose";
import { createDoor, readTerms } from "./door";
import { emptyPlanes, planesEqual, rebuildPlanes } from "./planes";
import type { Planes } from "./planes";

const PLANES_FILE = path.join(STATE_DIR, "planes.json");
const BODY_LIMIT = 65_536;

const log = (severity: "INFO" | "WARNING" | "ERROR", message: string, fields: Record<string, unknown> = {}) => console.log(JSON.stringify({ severity, message, ...fields }));

function loadPlanes(): Planes | null {
  if (!existsSync(PLANES_FILE)) return null;
  try {
    return JSON.parse(readFileSync(PLANES_FILE, "utf8")) as Planes;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  mkdirSync(path.join(STATE_DIR, "sessions"), { recursive: true });
  const machines = await composeMachines({ documents: "files" });
  const rebuilt = await rebuildPlanes(machines);
  const stored = loadPlanes();
  const sessions = (await machines.sessions()).length;
  if (stored) log(planesEqual(stored, rebuilt) ? "INFO" : "WARNING", `planes rebuilt from ${sessions} stored sessions: ${planesEqual(stored, rebuilt) ? "identical to the planes last written" : "DIFFERENT from the planes last written — the rebuilt ones stand"}`);
  else log("INFO", `planes rebuilt from ${sessions} stored sessions`);
  const door = createDoor(machines, readTerms(), rebuilt);
  const persist = () => writeFileSync(PLANES_FILE, JSON.stringify(door.planes, null, 2));
  persist();

  let counter = 0;
  const mint = (prefix: string): string => `${prefix}-${Date.now().toString(36)}${(counter += 1).toString(36)}`;
  const now = () => new Date().toISOString();

  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    let size = 0;
    request.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size <= BODY_LIMIT) chunks.push(chunk);
    });
    request.on("end", () => {
      const answer = (status: number, body: unknown) => {
        response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
        response.end(JSON.stringify(body, null, 2));
        if (request.url !== "/ready") log(status >= 500 ? "ERROR" : status >= 400 ? "WARNING" : "INFO", `${request.method} ${request.url} → ${status}`);
      };
      if (size > BODY_LIMIT) return answer(413, { error: "the body is too large" });
      const url = new URL(request.url ?? "/", "http://door");
      const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/").map(decodeURIComponent);
      let body: Record<string, unknown> = {};
      if (chunks.length > 0) {
        try {
          body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
        } catch {
          return answer(400, { error: "the body is not JSON" });
        }
      }
      const method = request.method ?? "GET";
      const handle = async (): Promise<void> => {
        const [root, id, leaf] = segments;
        if (root === "ready") return answer(200, { ready: true, machineClass: machines.classLine });
        if (root === "orders" && method === "POST") {
          const placed = await door.placeOrder({ orderId: typeof body.orderId === "string" ? body.orderId : mint("ord"), amountMinor: Number(body.amountMinor), currency: typeof body.currency === "string" ? body.currency : undefined, payerRef: String(body.payerRef ?? ""), lines: Array.isArray(body.lines) ? (body.lines as { sku: string; qty: number; priceMinor: number }[]) : [], at: now() });
          persist();
          return answer(201, { order: placed.order, invoice: placed.invoiceId ? door.planes.invoices[placed.invoiceId] : null, upToOffset: placed.upToOffset });
        }
        if (root === "invoices" && id && leaf === "attempts" && method === "POST") {
          const opened = await door.openAttempt({ attemptId: typeof body.attemptId === "string" ? body.attemptId : mint("att"), invoiceId: id, bin: String(body.bin ?? ""), last4: String(body.last4 ?? ""), at: now() });
          persist();
          return answer(201, { attempt: opened.attempt, upToOffset: opened.upToOffset });
        }
        if (root === "attempts" && id && leaf === "authentication" && method === "POST") {
          const outcome = body.outcome === "failed" ? "failed" : "passed";
          const answered = await door.answerChallenge({ attemptId: id, outcome, at: now() });
          persist();
          return answer(200, { attempt: answered.attempt, upToOffset: answered.upToOffset });
        }
        if (root === "attempts" && id && leaf === "review" && method === "POST") {
          const decision = body.decision === "block" ? "block" : "clear";
          const decided = await door.decideReview({ attemptId: id, decision, actor: String(body.actor ?? "reviewer"), at: now() });
          persist();
          return answer(200, { attempt: decided.attempt, upToOffset: decided.upToOffset });
        }
        if (root === "planes" && method === "GET") {
          if (!id) return answer(200, { orders: door.planes.orders, invoices: door.planes.invoices, attempts: door.planes.attempts, ledger: door.planes.ledger });
          const plane = (door.planes as unknown as Record<string, unknown>)[id];
          return plane === undefined || id === "mirrored" ? answer(404, { error: `no plane '${id}'` }) : answer(200, plane);
        }
        if (root === "machines" && method === "GET") {
          if (!id) return answer(200, { sessions: await machines.sessions(), machineClass: machines.classLine });
          if (leaf === "log") return answer(200, { session: id, tuples: await machines.log(id) });
          if (leaf === "queue") return answer(200, await machines.queue(id));
          return answer(404, { error: "a machine answers /log and /queue" });
        }
        if (root === "machine") {
          const query: Record<string, string> = {};
          url.searchParams.forEach((value, key) => (query[key] = value));
          const headers: Record<string, string> = {};
          for (const [key, value] of Object.entries(request.headers)) if (typeof value === "string") headers[key.toLowerCase()] = value;
          const result = await machines.request({ method, path: `/${segments.slice(1).join("/")}`, query, headers, body: chunks.length > 0 ? body : undefined });
          if (method === "POST") {
            await door.mirrorAll();
            persist();
          }
          return answer(result.status, result.body);
        }
        return answer(404, { error: "unknown root" });
      };
      handle().catch((error: unknown) => answer(422, { error: error instanceof Error ? error.message : String(error) }));
    });
    request.on("error", () => {
      response.writeHead(400);
      response.end();
    });
  });

  const port = Number(process.env.PORT ?? 8788);
  server.listen(port, () => log("INFO", `the door listens on ${port}`, { machineClass: machines.classLine, sessions: STATE_DIR }));
  process.on("SIGTERM", () => server.close(() => process.exit(0)));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
