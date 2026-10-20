import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Allocation, PspFact } from '@river/psp-facts';
import { balancesOf, isBalanced, postingsOf } from './gate.ts';

const fact = (type: string, payload: Record<string, unknown>): PspFact => ({ stream: 's', seq: 0, type, payload, origin: { via: 'figure', by: 'test' }, wave: 0, causedBy: null, at: '2026-10-01T10:00:00Z' }) as unknown as PspFact;
const shares: Allocation[] = [
  { recipientUnitId: 'seller', role: 'seller', amountMinor: 9_000, currency: 'UAH', rule: 0, holdUntil: null },
  { recipientUnitId: 'psp', role: 'psp_fee', amountMinor: 190, currency: 'UAH', rule: 1, holdUntil: null },
  { recipientUnitId: 'market', role: 'platform', amountMinor: 810, currency: 'UAH', rule: 2, holdUntil: null },
];

test('the split, a refund and a payout are each a balanced entry; replay gives the same balances', () => {
  const journal = [
    postingsOf(fact('split.Allocated', { sessionId: 's', paymentId: 'p', orderId: 'o', acquirer: 'acq', amountMinor: 10_000, currency: 'UAH', allocations: shares })),
    postingsOf(fact('refund.Completed', { paymentId: 'p', refundId: 'r', invoiceId: 'i', orderId: 'o', acquirer: 'acq', amountMinor: 1_000, currency: 'UAH', allocations: [{ ...shares[0]!, amountMinor: -900 }, { ...shares[2]!, amountMinor: -100 }] })),
    postingsOf(fact('payout.Sent', { paymentId: 'p', batchId: 'b', acquirer: 'acq', recipientUnitId: 'seller', amountMinor: 8_100, currency: 'UAH' })),
  ];
  for (const entry of journal) assert.equal(isBalanced(entry), true);
  const balances = balancesOf(journal.flat());
  assert.deepEqual(balances.map((b) => [b.account, b.balanceMinor]), [['clearing:acq', 900], ['payable:market', -710], ['payable:seller', 0], ['revenue:psp-fees', -190]]);
  assert.equal(balances.reduce((s, b) => s + b.balanceMinor, 0), 0, 'the whole ledger balances');
  assert.deepEqual(postingsOf(fact('capture.Completed', {})), [], 'the ledger forms from the split, not from the capture');
});

test('a reserve share is kept in its own account and leaves it when it is paid out', () => {
  const kept: Allocation[] = [
    { recipientUnitId: 'shop', role: 'merchant', amountMinor: 9_310, currency: 'EUR', rule: 0, holdUntil: null },
    { recipientUnitId: 'psp', role: 'psp_fee', amountMinor: 200, currency: 'EUR', rule: 1, holdUntil: null },
    { recipientUnitId: 'shop', role: 'reserve', amountMinor: 490, currency: 'EUR', rule: -1, holdUntil: '2026-12-30T10:00:00Z' },
  ];
  const journal = [
    postingsOf(fact('split.Allocated', { sessionId: 's', paymentId: 'p', orderId: 'o', acquirer: 'acq', amountMinor: 10_000, currency: 'EUR', allocations: kept })),
    postingsOf(fact('payout.Sent', { paymentId: 'p', batchId: 'b1', acquirer: 'acq', rule: 0, recipientUnitId: 'shop', amountMinor: 9_310, currency: 'EUR' })),
  ];
  assert.deepEqual(balancesOf(journal.flat()).filter((b) => b.balanceMinor !== 0).map((b) => [b.account, b.balanceMinor]), [['clearing:acq', 690], ['reserve:shop', -490], ['revenue:psp-fees', -200]]);
  journal.push(postingsOf(fact('payout.Sent', { paymentId: 'p', batchId: 'b2_r', acquirer: 'acq', rule: -1, recipientUnitId: 'shop', amountMinor: 490, currency: 'EUR' })));
  for (const entry of journal) assert.equal(isBalanced(entry), true);
  const after = balancesOf(journal.flat());
  assert.equal(after.find((b) => b.account === 'reserve:shop')?.balanceMinor, 0, 'the reserve is empty once paid out');
  assert.equal(after.find((b) => b.account === 'payable:shop')?.balanceMinor, 0, 'and the merchant’s payable was never touched by it');
});
