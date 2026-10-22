// The walk as a regression: the six stories end where the programme says
// they end; the planes rebuilt from the logs are the same planes; every
// settled payment balances; and a second run commits byte-identical logs —
// the deterministic class (Vol. 08 §5): same seeds, same log, byte for byte.

import assert from "node:assert/strict";
import { test } from "node:test";
import { composeMachines } from "./compose";
import { createDoor, readTerms } from "./door";
import { ledgerBalanced, planesEqual, rebuildPlanes } from "./planes";
import { factOf } from "./types";
import { runStories } from "./walk";

async function run() {
  const machines = await composeMachines({ documents: "memory" });
  const door = createDoor(machines, readTerms());
  await runStories(door);
  const logs: Record<string, string> = {};
  for (const session of await machines.sessions()) logs[session] = JSON.stringify(await machines.log(session));
  return { machines, door, logs };
}

test("the six stories end where the programme says", async () => {
  const { door } = await run();
  const stage = (id: string) => door.planes.attempts[id]!.stage;
  assert.equal(stage("att-1001-1"), "settled");
  assert.equal(door.planes.attempts["att-1001-1"]!.acquirer, "acq-dnipro", "the card's own bank, on-us");
  assert.equal(door.planes.attempts["att-1001-1"]!.onUs, true);
  assert.equal(door.planes.attempts["att-1001-1"]!.feeMinor, Math.round((32_500 * 90) / 10_000), "the on-us rate of the terms");
  assert.equal(stage("att-1002-1"), "settled");
  assert.equal(stage("att-1003-1"), "settled");
  assert.equal(stage("att-1004-1"), "declined");
  assert.equal(stage("att-1004-2"), "settled");
  assert.equal(door.planes.invoices["inv-ord-1004"]!.paidBy, "att-1004-2", "the retry is a new machine on the same invoice");
  assert.equal(stage("att-1005-1"), "blocked");
  assert.equal(stage("att-1006-1"), "failed");
  assert.equal(door.planes.orders["ord-1006"]!.status, "invoiced", "a failed capture leaves the order unpaid");
});

test("the invoice is issued by the order machine, once, with the amount and the due date of the terms", async () => {
  const { machines, door } = await run();
  const log = await machines.log("ord-1001");
  const issued = log.filter((tuple) => factOf(tuple)?.factType === "invoice.Issued");
  assert.equal(issued.length, 1);
  const result = (factOf(issued[0]!)!.data.result ?? {}) as { invoiceId: string; amountMinor: number; dueAt: string };
  assert.equal(result.invoiceId, "inv-ord-1001");
  assert.equal(result.amountMinor, 32_500);
  assert.equal(result.dueAt, new Date(Date.parse("2026-10-21T09:00:00.000Z") + door.terms.invoiceTtlHours * 3_600_000).toISOString());
});

test("the planes rebuilt from the logs are the same planes, and the ledger balances", async () => {
  const { machines, door } = await run();
  assert.ok(planesEqual(await rebuildPlanes(machines), door.planes));
  assert.ok(ledgerBalanced(door.planes));
  assert.equal(door.planes.ledger.length, 4 * 3, "four settled payments, three postings each");
});

test("a second run commits byte-identical logs — the deterministic class", async () => {
  const first = await run();
  const second = await run();
  assert.deepEqual(Object.keys(second.logs).sort(), Object.keys(first.logs).sort());
  for (const session of Object.keys(first.logs)) assert.equal(second.logs[session], first.logs[session], `the log of ${session}`);
});

test("the door refuses what the planes do not know, and what the machine does not wait for", async () => {
  const { door } = await run();
  await assert.rejects(() => door.openAttempt({ attemptId: "att-x", invoiceId: "inv-nobody", bin: "411111", last4: "4242", at: "2026-10-21T10:00:00.000Z" }), /know no invoice/);
  await assert.rejects(() => door.openAttempt({ attemptId: "att-x", invoiceId: "inv-ord-1001", bin: "411111", last4: "4242", at: "2026-10-21T10:00:00.000Z" }), /is paid by att-1001-1/);
  await assert.rejects(() => door.answerChallenge({ attemptId: "att-1001-1", outcome: "passed", at: "2026-10-21T10:00:00.000Z" }), /does not wait for a challenge/);
});
