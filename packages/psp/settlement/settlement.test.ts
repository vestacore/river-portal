import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PspFact } from '@river/psp-facts';
import { reconcileBatch, settlementProjector, type SettlementView } from './gate.ts';

const fact = (type: string, payload: Record<string, unknown>, at = '2026-10-10T08:00:00.000Z'): PspFact => ({ stream: 'stl_x', seq: 0, type, payload, origin: { via: 'world', controller: 'test', answering: null }, wave: 0, causedBy: null, at }) as unknown as PspFact;
const fold = (facts: PspFact[]) => facts.reduce<SettlementView | null>((v, f) => settlementProjector.project(v, f), null);
const batch = 'stl_acq-x_m_20261009';
const sales = fact('sales.Reported', { batchId: batch, source: 'pos', provider: 'acq-x', merchantId: 'm', storeId: 's', businessDate: '2026-10-09', currency: 'UAH', count: 120, grossMinor: 4_000_000 });
const report = (feeMinor: number, grossMinor = 4_000_000) => fact('settlement.Reported', { batchId: batch, provider: 'acq-x', merchantId: 'm', storeId: 's', channel: 'in_store', businessDate: '2026-10-09', valueDate: '2026-10-10', currency: 'UAH', count: 120, grossMinor, feeMinor, refundsMinor: 0, chargebacksMinor: 0, netMinor: grossMinor - feeMinor, lines: [] });
const credit = (amountMinor: number) => fact('settlement.Credited', { batchId: batch, account: 'UA00', valueDate: '2026-10-10', amountMinor, reference: batch });
const expected = { grossMinor: null, feeMinor: 46_000, netMinor: null, source: 'sales' as const };

test('a batch reconciles three ways: the merchant’s sales, the provider’s report, the bank’s credit', () => {
  const v = fold([sales, report(46_000), credit(3_954_000)])!;
  assert.equal(v.channel, 'in_store');
  assert.equal(reconcileBatch(v, expected, '2026-10-12T00:00:00.000Z').status, 'matched');
  const fee = reconcileBatch(fold([sales, report(52_000), credit(3_948_000)])!, expected, '2026-10-12T00:00:00.000Z');
  assert.equal(fee.status, 'fee_difference');
  assert.deepEqual(fee.differences, [{ kind: 'fee', expectedMinor: 46_000, actualMinor: 52_000, deltaMinor: 6_000 }]);
  assert.equal(reconcileBatch(fold([sales, report(46_000, 3_900_000), credit(3_854_000)])!, expected, '2026-10-12T00:00:00.000Z').status, 'gross_difference');
  assert.equal(reconcileBatch(fold([sales, report(46_000), credit(3_940_000)])!, expected, '2026-10-12T00:00:00.000Z').status, 'short_credit');
});

test('what is missing is awaited for a while, then is a finding; a person’s resolution closes it', () => {
  const awaiting = fold([sales])!;
  assert.equal(reconcileBatch(awaiting, null, '2026-10-10T12:00:00.000Z').status, 'awaiting_report');
  assert.equal(reconcileBatch(awaiting, null, '2026-10-14T12:00:00.000Z').status, 'not_reported');
  const reported = fold([sales, report(46_000)])!;
  assert.equal(reconcileBatch(reported, expected, '2026-10-11T12:00:00.000Z').status, 'awaiting_credit');
  assert.equal(reconcileBatch(reported, expected, '2026-10-13T12:00:00.000Z').status, 'not_credited');
  const resolved = fold([sales, report(52_000), credit(3_948_000), fact('settlement.Resolved', { batchId: batch, resolution: 'claim_raised', amountMinor: 6_000, note: 'Debit cards billed as premium', by: 'r-natalia' })])!;
  assert.equal(reconcileBatch(resolved, expected, '2026-10-12T00:00:00.000Z').status, 'resolved');
  assert.equal(settlementProjector.project(null, credit(1)), null, 'a credit for an unknown batch forms nothing');
});
