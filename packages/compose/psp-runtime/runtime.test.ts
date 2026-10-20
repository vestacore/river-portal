import assert from 'node:assert/strict';
import { test } from 'node:test';
import { factDefinition, type PspFact } from '@river/psp-facts';
import { invoiceProjector } from '@river/psp-invoice';
import { balancesOf, isBalanced } from '@river/psp-ledger';
import { orderProjector } from '@river/psp-order';
import { paymentProjector } from '@river/psp-payment';
import { sessionProjector } from '@river/psp-session';
import { boundaryOfStream } from './boundaryOfStream.ts';
import { createWorld } from './createWorld.ts';
import { refreshSwarm } from './refreshSwarm.ts';
import { seedHistory } from './seedHistory.ts';
import { seedOnboarding } from './seedOnboarding.ts';

const now = '2026-10-19T12:00:00.000Z';
const started = Date.now();
const world = createWorld(now);
seedHistory(world, now, 21);
seedOnboarding(world, now);
refreshSwarm(world, now);
const seededMs = Date.now() - started;

test('the history is a real river: many orders, sessions, payments and every outcome', () => {
  const sessions = [...world.views.sessions.values()];
  const outcomes = new Set(sessions.map((s) => s.outcome));
  console.log(`seeded in ${seededMs} ms: ${world.log.length} facts, ${world.views.orders.size} orders, ${sessions.length} sessions, ${world.views.payments.size} payments, ${world.alerts.length} alerts, ${world.insights.length} insights, ${world.deliveries.length} deliveries`);
  assert.ok(world.views.orders.size > 400);
  for (const outcome of ['succeeded', 'failed', 'abandoned']) assert.ok(outcomes.has(outcome as never), `some sessions ${outcome}`);
  const instruments = new Set([...world.views.payments.values()].map((p) => p.instrument));
  assert.ok(instruments.size >= 9, `payments by ${instruments.size} instruments`);
});

test('every fact sits in a stream of the boundary that owns it, numbered densely', () => {
  for (const [stream, facts] of world.streams) {
    const boundary = boundaryOfStream(stream);
    facts.forEach((fact, i) => { assert.equal(fact.seq, i); assert.equal(factDefinition(fact.type).owner, boundary, `${fact.type} in ${stream}`); });
  }
});

test('the views are projections: replaying the log gives exactly the stored views', () => {
  const replay = <V>(projector: { hears: readonly string[]; keyOf: (f: PspFact) => string | null; project: (v: V | null, f: PspFact) => V | null }) => {
    const views = new Map<string, V>();
    for (const fact of world.log) {
      if (!projector.hears.includes(fact.type)) continue;
      const key = projector.keyOf(fact);
      if (!key) continue;
      const next = projector.project(views.get(key) ?? null, fact);
      if (next) views.set(key, next);
    }
    return views;
  };
  assert.deepEqual(replay(orderProjector), world.views.orders);
  assert.deepEqual(replay(invoiceProjector), world.views.invoices);
  assert.deepEqual(replay(sessionProjector), world.views.sessions);
  assert.deepEqual(replay(paymentProjector), world.views.payments);
});

test('money is conserved: every journal entry balances, so does the whole ledger, and every split sums to its capture', () => {
  for (const entry of world.journal) assert.equal(isBalanced(entry.postings), true, `${entry.type} ${entry.stream}#${entry.seq}`);
  const byCurrency = new Map<string, number>();
  for (const b of balancesOf(world.journal.flatMap((e) => e.postings))) byCurrency.set(b.currency, (byCurrency.get(b.currency) ?? 0) + b.balanceMinor);
  for (const [currency, net] of byCurrency) assert.equal(net, 0, currency);
  for (const p of world.views.payments.values()) if (p.capturedMinor > 0) assert.equal(p.allocations.reduce((s, a) => s + a.amountMinor, 0), p.capturedMinor, p.paymentId);
});

test('the swarm found something to propose, and nothing high-risk was done without a person', () => {
  const agents = new Set(world.insights.map((i) => i.agent));
  assert.ok(agents.size >= 4, `insights by ${[...agents].join(', ')}`);
  for (const insight of world.insights) if (insight.status === 'auto_applied') assert.equal(insight.proposal?.risk, 'low');
});
