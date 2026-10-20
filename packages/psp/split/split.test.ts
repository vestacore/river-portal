import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { OrderLine } from '@river/psp-facts';
import { allocate, planFromTemplate, reverseShares } from './gate.ts';

const line = (sku: string, totalMinor: number, sellerUnitId: string | null): OrderLine => ({ sku, title: { 'en-GB': sku }, quantity: 1, unitMinor: totalMinor, totalMinor, sellerUnitId });
const lines = [line('honey', 85_000, 'honey'), line('jug', 120_000, 'ceramics'), line('bread', 40_000, 'bakery')];
const plan = planFromTemplate('marketplace', { merchantUnitId: 'market', pspUnitId: 'psp', sellerUnitIds: ['honey', 'ceramics', 'bakery'], commissionBps: 800, charityBps: 100, charityUnitId: 'charity', franchisorUnitId: null, royaltyBps: 0, holdDays: 0 });

test('a marketplace order becomes a delta that sums exactly to the capture', () => {
  const shares = allocate({ amountMinor: 245_000, currency: 'UAH', orderTotalMinor: 245_000, lines, plan, feeMinor: 4_655, at: '2026-10-01T10:00:00Z' });
  assert.deepEqual(shares.map((s) => [s.recipientUnitId, s.role, s.amountMinor]), [
    ['honey', 'seller', 78_200], ['ceramics', 'seller', 110_400], ['bakery', 'seller', 36_800], ['charity', 'charity', 2_450], ['psp', 'psp_fee', 4_655], ['market', 'platform', 12_495],
  ]);
  assert.equal(shares.reduce((s, x) => s + x.amountMinor, 0), 245_000);
});

test('conservation for any amount: partial captures, odd numbers, no money made or lost', () => {
  for (let amount = 1; amount <= 245_000; amount += 997) {
    const fee = Math.floor(amount * 190 / 10_000);
    const shares = allocate({ amountMinor: amount, currency: 'UAH', orderTotalMinor: 245_000, lines, plan, feeMinor: fee, at: '2026-10-01T10:00:00Z' });
    assert.equal(shares.reduce((s, x) => s + x.amountMinor, 0), amount);
    assert.ok(shares.every((s) => s.amountMinor >= 0));
  }
  assert.throws(() => allocate({ amountMinor: 100, currency: 'UAH', orderTotalMinor: 100, lines: [], plan: { templateId: null, rules: [{ recipientUnitId: 'x', role: 'merchant', basis: 'fixed', fixedMinor: 200 }, { recipientUnitId: 'y', role: 'merchant', basis: 'remainder' }] }, feeMinor: 0, at: '2026-10-01T10:00:00Z' }));
});

test('a refund is given back by the shares that received it, never by the fee', () => {
  const shares = allocate({ amountMinor: 245_000, currency: 'UAH', orderTotalMinor: 245_000, lines, plan, feeMinor: 4_655, at: '2026-10-01T10:00:00Z' });
  const back = reverseShares(shares, 50_000);
  assert.equal(back.reduce((s, x) => s + x.amountMinor, 0), -50_000);
  assert.ok(back.every((s) => s.role !== 'psp_fee' && s.amountMinor < 0));
  const full = reverseShares(shares, 245_000);
  assert.equal(full.reduce((s, x) => s + x.amountMinor, 0), -245_000, 'a full refund returns everything the payer paid');
  assert.equal(full.find((s) => s.role === 'platform')!.amountMinor, -(12_495 + 4_655), 'the marketplace carries the fee the PSP keeps');
  assert.throws(() => reverseShares(shares, 245_001));
});

test('a rolling reserve is its own stream of the delta, carved from the remainder and held', () => {
  const shares = allocate({ amountMinor: 245_000, currency: 'UAH', orderTotalMinor: 245_000, lines, plan, feeMinor: 4_655, at: '2026-10-01T10:00:00Z', reserveBps: 1_000, reserveDays: 90 });
  const reserve = shares.find((s) => s.role === 'reserve')!;
  assert.equal(reserve.amountMinor, 1_249);
  assert.equal(reserve.rule, -1);
  assert.equal(reserve.holdUntil, '2026-12-30T10:00:00.000Z');
  assert.equal(shares.find((s) => s.role === 'platform')!.amountMinor, 12_495 - 1_249);
  assert.equal(shares.reduce((s, x) => s + x.amountMinor, 0), 245_000);
});
