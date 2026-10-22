// THE WALK — six stories of a payment attempt run on machines in memory,
// each session's log printed as the machine committed it, then the planes
// the door projected and two checks: the planes rebuilt from the logs are
// the same planes, and every settled payment balances. Nothing here is
// random and nothing reads a clock: a second run commits byte-identical
// logs (walk.test.ts proves it).

import { composeMachines } from "./compose";
import { createDoor, readTerms } from "./door";
import type { Door } from "./door";
import { ledgerBalanced, planesEqual, rebuildPlanes } from "./planes";
import type { Machines } from "./compose";
import { factOf } from "./types";
import type { WaveTuple } from "./types";

export const CLOCK = "2026-10-21T09:00:00.000Z";

export type Story = { name: string; sessions: string[] };

export async function runStories(door: Door): Promise<Story[]> {
  const stories: Story[] = [];
  const t = (minutes: number): string => new Date(Date.parse(CLOCK) + minutes * 60_000).toISOString();

  // 1. A frictionless card payment on the card's own bank — on-us.
  await door.placeOrder({ orderId: "ord-1001", amountMinor: 32_500, payerRef: "payer-anna", lines: [{ sku: "bread", qty: 2, priceMinor: 6_250 }, { sku: "milk", qty: 4, priceMinor: 5_000 }], at: t(0) });
  await door.openAttempt({ attemptId: "att-1001-1", invoiceId: "inv-ord-1001", bin: "411111", last4: "4242", at: t(1) });
  stories.push({ name: "frictionless, on-us", sessions: ["ord-1001", "att-1001-1"] });

  // 2. Above the challenge threshold: the payer authenticates, then the acquirer is asked.
  await door.placeOrder({ orderId: "ord-1002", amountMinor: 240_000, payerRef: "payer-bohdan", at: t(2) });
  await door.openAttempt({ attemptId: "att-1002-1", invoiceId: "inv-ord-1002", bin: "520000", last4: "1881", at: t(3) });
  await door.answerChallenge({ attemptId: "att-1002-1", outcome: "passed", at: t(4) });
  stories.push({ name: "challenged, then approved", sessions: ["ord-1002", "att-1002-1"] });

  // 3. Held for review; a person clears it; the route is the same function through the reviewer's door.
  await door.placeOrder({ orderId: "ord-1003", amountMinor: 600_000, payerRef: "payer-chen", at: t(5) });
  await door.openAttempt({ attemptId: "att-1003-1", invoiceId: "inv-ord-1003", bin: "400000", last4: "0002", at: t(6) });
  await door.decideReview({ attemptId: "att-1003-1", decision: "clear", actor: "r-anna", at: t(7) });
  await door.answerChallenge({ attemptId: "att-1003-1", outcome: "passed", at: t(8) });
  stories.push({ name: "review, cleared, challenged, approved", sessions: ["ord-1003", "att-1003-1"] });

  // 4. Declined for insufficient funds; the payer tries another card — a new machine on the same invoice.
  await door.placeOrder({ orderId: "ord-1004", amountMinor: 9_951, payerRef: "payer-dasha", at: t(9) });
  await door.openAttempt({ attemptId: "att-1004-1", invoiceId: "inv-ord-1004", bin: "411111", last4: "0051", at: t(10) });
  await door.openAttempt({ attemptId: "att-1004-2", invoiceId: "inv-ord-1004", bin: "400000", last4: "7777", at: t(11) });
  stories.push({ name: "declined, retried on a new machine", sessions: ["ord-1004", "att-1004-1", "att-1004-2"] });

  // 5. A blocked payer: screening ends the attempt.
  await door.placeOrder({ orderId: "ord-1005", amountMinor: 5_000, payerRef: "payer-blocked", at: t(12) });
  await door.openAttempt({ attemptId: "att-1005-1", invoiceId: "inv-ord-1005", bin: "411111", last4: "4242", at: t(13) });
  stories.push({ name: "blocked by screening", sessions: ["ord-1005", "att-1005-1"] });

  // 6. Authorised, but the acquirer cannot capture.
  await door.placeOrder({ orderId: "ord-1006", amountMinor: 12_000, payerRef: "payer-eva", at: t(14) });
  await door.openAttempt({ attemptId: "att-1006-1", invoiceId: "inv-ord-1006", bin: "520000", last4: "0091", at: t(15) });
  stories.push({ name: "authorised, capture failed", sessions: ["ord-1006", "att-1006-1"] });

  return stories;
}

export function describeTuple(tuple: WaveTuple): string {
  const fact = factOf(tuple);
  const offset = `#${String(tuple.offset).padStart(2)}`;
  if (!fact) {
    const id = (tuple.payload as { id?: string; knotId?: string }).id ?? (tuple.payload as { knotId?: string }).knotId ?? "";
    return `${offset} ${tuple.kind.padEnd(22)} ${id}`;
  }
  const data = fact.data;
  const by = data.by as { controller?: string; function?: string; standIn?: boolean } | undefined;
  const marks = ["band", "challenge", "outcome"].filter((mark) => data[mark] !== undefined).map((mark) => `${mark}=${String(data[mark])}`);
  const who = by ? `← ${by.function ?? by.controller}` : data.represented ? "← re-presented" : data.triggeredBy ? `← ${String((data.triggeredBy as string[])[0])}` : data.uid ? "→ the membrane" : "← the door";
  const detail = fact.factType === "service.failed" ? `: ${String(data.reason ?? data.error)}` : marks.length > 0 ? ` [${marks.join(" ")}]` : "";
  return `${offset} ${fact.factType.padEnd(22)} ${who}${detail}`;
}

export async function printWalk(machines: Machines, door: Door, stories: Story[]): Promise<void> {
  console.log(`machine class: ${machines.classLine}\n`);
  for (const story of stories) {
    console.log(`── ${story.name}`);
    for (const session of story.sessions) {
      const log = await machines.log(session);
      console.log(`   ${session} (${log.length} tuples)`);
      for (const tuple of log) if (tuple.kind !== "sys.knot.defined" && tuple.kind !== "sys.descriptor.defined") console.log(`     ${describeTuple(tuple)}`);
    }
    console.log("");
  }
  console.log("── the planes");
  for (const row of Object.values(door.planes.orders)) console.log(`   order ${row.orderId}: ${row.amountMinor / 100} ${row.currency} · ${row.status}`);
  for (const row of Object.values(door.planes.invoices)) console.log(`   invoice ${row.invoiceId}: ${row.status}${row.paidBy ? ` by ${row.paidBy}` : ""} · attempts ${row.attempts.join(", ") || "none"}`);
  for (const row of Object.values(door.planes.attempts)) console.log(`   attempt ${row.sessionId}: ${row.stage}${row.waits ? ` (waits for ${row.waits})` : ""}${row.acquirer ? ` · ${row.acquirer}${row.onUs ? " on-us" : ""}` : ""}${row.feeMinor !== null ? ` · fee ${row.feeMinor / 100}` : ""}${row.reason ? ` · ${row.reason}` : ""}`);
  console.log(`   ledger: ${door.planes.ledger.length} postings, ${ledgerBalanced(door.planes) ? "balanced" : "NOT balanced"}`);
  const rebuilt = await rebuildPlanes(machines);
  console.log(`   replay check: the planes rebuilt from ${(await machines.sessions()).length} logs are ${planesEqual(rebuilt, door.planes) ? "identical" : "DIFFERENT"}`);
}

async function main(): Promise<void> {
  const machines = await composeMachines({ documents: "memory" });
  const door = createDoor(machines, readTerms());
  const stories = await runStories(door);
  await printWalk(machines, door, stories);
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exit(1);
  });
}
