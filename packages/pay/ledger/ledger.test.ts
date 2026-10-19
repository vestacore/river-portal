import assert from 'node:assert/strict';
import { test } from 'node:test';
import { accountBalances, capturePostings, feeMinor, isBalanced } from './gate.ts';

test('the commission is integer arithmetic, rounded half up', () => {
  assert.equal(feeMinor(10_000, 250), 250);
  assert.equal(feeMinor(999, 250), 25, '24.975 rounds up');
  assert.equal(feeMinor(19, 250), 0, '0.475 rounds down');
  assert.equal(feeMinor(20, 250), 1, '0.5 rounds up');
  assert.equal(feeMinor(0, 250), 0);
  assert.throws(() => feeMinor(10.5, 250));
  assert.throws(() => feeMinor(100, 10_001));
});

test('a capture is a balanced double entry: the fee is taken from the amount, never added', () => {
  const postings = capturePostings({ merchantId: 'm1', provider: 'stripe', amountMinor: 12_000, feeMinor: 300, currency: 'EUR' });
  assert.equal(isBalanced(postings), true);
  assert.deepEqual(accountBalances(postings).map((b) => [b.account, b.balanceMinor]), [['merchant:m1:payable', -11_700], ['platform:fees', -300], ['provider:stripe:clearing', 12_000]]);
  assert.equal(isBalanced(capturePostings({ merchantId: 'm1', provider: 'paypal', amountMinor: 500, feeMinor: 0, currency: 'USD' })), true, 'no fee line when the fee is zero');
  assert.throws(() => capturePostings({ merchantId: 'm1', provider: 'stripe', amountMinor: 100, feeMinor: 200, currency: 'EUR' }));
});

test('conservation holds for every amount and fee: no water is made or lost', () => {
  for (let amount = 0; amount <= 3_000; amount += 7) {
    for (const bps of [0, 1, 99, 250, 2_999, 10_000]) {
      const fee = feeMinor(amount, bps);
      assert.ok(fee >= 0 && fee <= amount);
      assert.equal(isBalanced(capturePostings({ merchantId: 'm', provider: 'stripe', amountMinor: amount, feeMinor: fee, currency: 'UAH' })), true);
    }
  }
  assert.equal(isBalanced([{ account: 'a', side: 'debit', amountMinor: 5, currency: 'EUR' }, { account: 'b', side: 'credit', amountMinor: 5, currency: 'USD' }]), false, 'currencies do not net against each other');
});
