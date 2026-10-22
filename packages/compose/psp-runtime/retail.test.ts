import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PspFact } from '@river/psp-facts';
import { invoiceProjector } from '@river/psp-invoice';
import { isBalanced } from '@river/psp-ledger';
import { orderProjector } from '@river/psp-order';
import { paymentProjector } from '@river/psp-payment';
import { sessionProjector } from '@river/psp-session';
import { settlementProjector } from '@river/psp-settlement';
import { createWorld } from './createWorld.ts';
import { retailStand } from './data/retailStand.ts';
import { retailStores } from './data/retailStores.ts';
import { reconcileSettlements } from './reconcileSettlements.ts';
import { refreshSwarm } from './refreshSwarm.ts';
import { seedRetail } from './seedRetail.ts';

const now = '2026-10-20T12:00:00.000Z';
const world = createWorld(now, retailStand);
seedRetail(world, now, 45);
refreshSwarm(world, now);

test('the retail stand routes online cards on-us once its payments manager chose it, and sees every store’s day', () => {
  const sessions = [...world.views.sessions.values()];
  const ruled = sessions.filter((s) => s.route?.rule === 'on-us');
  assert.ok(ruled.length > 100, `${ruled.length} payments routed on-us by the strategy`);
  assert.ok(ruled.every((s) => s.route?.onUs && s.route.strategy === 'on_us_first'));
  assert.ok(sessions.some((s) => s.route?.strategy === 'approval_first'), 'before the change, routing was by approval');
  assert.equal(world.settings.find((s) => s.unitId === 'rt-group' && s.key === 'routing.strategy')?.value, 'on_us_first');
  const inStore = [...world.views.settlements.values()].filter((v) => v.channel === 'in_store');
  assert.ok(inStore.length >= retailStores.length * 40, `${inStore.length} store batches`);
  assert.ok([...world.views.orders.values()].some((o) => o.picked && o.picked.totalMinor < o.totalMinor), 'orders picked for less than ordered');
  assert.ok([...world.views.payments.values()].some((p) => p.instrument === 'bonus_points' && p.capturedMinor > 0), 'bonus points paid part of some orders');
});

test('the retail stand’s views are projections too, the settlement batches included', () => {
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
  assert.deepEqual(replay(settlementProjector), world.views.settlements);
});

test('where acquirers settle directly, the split pays the acquirer its fee and no PSP fee exists; the ledger balances', () => {
  for (const entry of world.journal) assert.equal(isBalanced(entry.postings), true, `${entry.type} ${entry.stream}#${entry.seq}`);
  const shares = [...world.views.payments.values()].flatMap((p) => p.allocations);
  assert.ok(shares.some((a) => a.role === 'acquirer_fee' && a.recipientUnitId.startsWith('acq:')));
  assert.ok(!shares.some((a) => a.role === 'psp_fee'), 'the platform takes no share of the money');
  for (const p of world.views.payments.values()) if (p.allocations.length > 0) assert.equal(p.allocations.reduce((s, a) => s + a.amountMinor, 0), p.capturedMinor);
});

test('reconciliation finds what the history hid, and the agents propose what to do about it', () => {
  const statuses = new Set(reconcileSettlements(world, now).map((r) => r.reconciliation.status));
  for (const s of ['fee_difference', 'not_reported', 'short_credit', 'not_credited', 'gross_difference', 'matched']) assert.ok(statuses.has(s as never), `a batch is ${s}`);
  assert.ok(world.insights.some((i) => i.proposal?.kind === 'raise_claim' && i.status === 'open'));
  assert.ok(world.insights.some((i) => i.proposal?.kind === 'change_policy' && i.proposal.params.key === 'pos.acquirer' && i.status === 'open'));
  assert.ok(!world.insights.some((i) => i.agent === 'treasurer'), 'cash forecasts belong to the group’s ERP');
  assert.ok(!world.insights.some((i) => i.status === 'auto_applied' && i.proposal?.risk === 'high'));
});
