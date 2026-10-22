import assert from 'node:assert/strict';
import { test } from 'node:test';
import { appendFacts } from './appendFacts.ts';
import { createWorld } from './createWorld.ts';
import { retailStand } from './data/retailStand.ts';
import { personaActor } from './personaActor.ts';
import { reconcileSettlements } from './reconcileSettlements.ts';
import { resolveSettlement } from './resolveSettlement.ts';

const at = '2026-10-20T10:00:00.000Z';
const batchId = 'stl_acq-dnipro_rt-kyiv-1_20261016';

/**
 * A store's day the bank reported short, in a retail world without history: the tills recorded ₴60,000
 * in card sales, Bank Dnipro's report settles ₴59,000 at its agreed rate, and the bank credited the net.
 */
function storeDayReportedShort() {
  const world = createWorld(at, retailStand);
  const from = (controller: string) => ({ via: 'world' as const, controller, answering: null });
  const fee = 67_850; // 1.15 % of ₴59,000: the blended rate of the stores' terms with Bank Dnipro
  appendFacts(world, batchId, [{ type: 'sales.Reported', payload: { batchId, source: 'pos', provider: 'acq-dnipro', merchantId: 'rt-retail', storeId: 'rt-kyiv-1', businessDate: '2026-10-16', currency: 'UAH', count: 120, grossMinor: 6_000_000 } }], from('pos:rt-kyiv-1'), '2026-10-17T01:00:00.000Z');
  appendFacts(world, batchId, [{ type: 'settlement.Reported', payload: {
    batchId, provider: 'acq-dnipro', merchantId: 'rt-retail', storeId: 'rt-kyiv-1', channel: 'in_store', businessDate: '2026-10-16', valueDate: '2026-10-17', currency: 'UAH',
    count: 118, grossMinor: 5_900_000, feeMinor: fee, refundsMinor: 0, chargebacksMinor: 0, netMinor: 5_900_000 - fee,
    lines: [{ issuer: 'bank-polissia', scheme: 'visa', product: 'debit', onUs: false, count: 118, grossMinor: 5_900_000, feeMinor: fee }],
  } }], from('acq-dnipro:settlement-report'), '2026-10-17T06:30:00.000Z');
  appendFacts(world, batchId, [{ type: 'settlement.Credited', payload: { batchId, account: 'UA00RT-RETAIL', valueDate: '2026-10-17', amountMinor: 5_900_000 - fee, reference: 'ACQ-DNIPRO_RT-KYIV-1_20261016' } }], from('bank:rt-retail'), '2026-10-17T16:00:00.000Z');
  const status = () => reconcileSettlements(world, at).find((r) => r.view.batchId === batchId)?.reconciliation.status;
  return { world, status, actor: (personId: string) => personaActor(world, personId, null, at)! };
}

test('the finance controller records a decision about a batch’s difference, and the batch is resolved', () => {
  const { world, status, actor } = storeDayReportedShort();
  assert.equal(status(), 'gross_difference', 'the bank reported ₴1,000 less than the tills recorded');
  const done = resolveSettlement(world, actor('r-natalia'), batchId, 'claim_raised', 100_000, '  Asked Bank Dnipro for the missing terminal batch  ', at);
  assert.equal(done.ok, true);
  assert.equal(status(), 'resolved');
  assert.deepEqual(world.views.settlements.get(batchId)?.resolutions, [{ resolution: 'claim_raised', amountMinor: 100_000, note: 'Asked Bank Dnipro for the missing terminal batch', by: 'r-natalia', at }]);
  const fact = world.streams.get(batchId)?.at(-1);
  assert.equal(fact?.type, 'settlement.Resolved');
  assert.deepEqual(fact?.origin, { via: 'door', actor: 'r-natalia', role: 'finance_controller' });
  assert.ok(world.audit.some((e) => e.action === 'settlement.claim_raised' && e.target === batchId && e.personId === 'r-natalia' && e.unitId === 'rt-kyiv-1'));
});

test('an online operator may not decide about a store’s batch, and nothing is written', () => {
  const { world, status, actor } = storeDayReportedShort();
  const facts = world.streams.get(batchId)?.length;
  const refused = resolveSettlement(world, actor('r-serhii'), batchId, 'accepted', 100_000, 'Looks fine', at);
  assert.equal(refused.ok, false);
  assert.match(refused.ok ? '' : refused.error, /reconciliation\.write/);
  assert.equal(world.streams.get(batchId)?.length, facts);
  assert.equal(status(), 'gross_difference');
  assert.ok(!world.audit.some((e) => e.target === batchId));
});

test('an unknown batch, an empty resolution or a batch that agrees is refused', () => {
  const { world, actor } = storeDayReportedShort();
  const natalia = actor('r-natalia');
  assert.deepEqual(resolveSettlement(world, natalia, 'stl_acq-dnipro_rt-kyiv-1_20200101', 'accepted', 0, '', at), { ok: false, error: 'not_found' });
  assert.deepEqual(resolveSettlement(world, natalia, batchId, '' as never, 0, 'No decision', at), { ok: false, error: 'resolution_required' });
  assert.deepEqual(resolveSettlement(world, natalia, batchId, 'accepted', Number.NaN, '', at), { ok: false, error: 'invalid_amount' });
  const agreeing = 'stl_acq-dnipro_rt-kyiv-2_20261016';
  appendFacts(world, agreeing, [{ type: 'settlement.Reported', payload: { batchId: agreeing, provider: 'acq-dnipro', merchantId: 'rt-retail', storeId: 'rt-kyiv-2', channel: 'in_store', businessDate: '2026-10-16', valueDate: '2026-10-17', currency: 'UAH', count: 0, grossMinor: 0, feeMinor: 0, refundsMinor: 0, chargebacksMinor: 0, netMinor: 0, lines: [] } }], { via: 'world', controller: 'acq-dnipro:settlement-report', answering: null }, at);
  assert.deepEqual(resolveSettlement(world, natalia, agreeing, 'accepted', 0, '', at), { ok: false, error: 'nothing_to_decide' });
});
