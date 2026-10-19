import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hashToken } from '@river/kernel';
import { payFacts, type OrderPlaced } from '@river/pay-facts';
import { parseAmount, placeOrder, requestCancellation, validateOrderInput } from './gate.ts';

test('amounts are read as minor units without floating point', () => {
  assert.equal(parseAmount('120'), 12_000);
  assert.equal(parseAmount('120.5'), 12_050);
  assert.equal(parseAmount('0,07'), 7);
  assert.equal(parseAmount('19.99'), 1_999);
  for (const bad of ['', '-5', '1.234', '1e3', '12 000', 'ten']) assert.equal(parseAmount(bad), null, bad);
});

test('an order form is checked field by field; the payer is a handle', () => {
  const good = validateOrderInput({ title: ' Ten loaves ', amount: '120.00', currency: 'EUR', payerRef: 'Anna.K' });
  assert.deepEqual(good, { ok: true, value: { title: 'Ten loaves', amountMinor: 12_000, currency: 'EUR', payerRef: 'anna.k' } });
  const bad = validateOrderInput({ title: '', amount: '0.10', currency: 'JPY', payerRef: 'a b' });
  assert.deepEqual(bad.ok ? [] : bad.errors.map((e) => `${e.field}:${e.code}`), ['title:required', 'amount:tooSmall', 'currency:invalid', 'payerRef:invalid']);
  const email = validateOrderInput({ title: 'Ten loaves', amount: '120', currency: 'EUR', payerRef: 'anna@example.org' });
  assert.deepEqual(email.ok ? [] : email.errors, [{ field: 'payerRef', code: 'invalid' }], 'an e-mail address is personal data: it is not a handle');
});

test('placing an order: the key is shown once and only its hash enters the river', () => {
  const placed = placeOrder({ title: 'Ten loaves', amountMinor: 12_000, currency: 'EUR', payerRef: 'anna.k' }, { merchantId: 'm1', providers: ['stripe'] }, new Date('2026-10-01T10:00:00Z'));
  const payload = placed.draft.payload as OrderPlaced;
  assert.equal(placed.draft.type, payFacts.orderPlaced);
  assert.match(placed.orderId, /^order_[0-9A-Z]{26}$/);
  assert.equal(payload.payKeyHash, hashToken(placed.payKey));
  assert.equal(JSON.stringify(placed.draft).includes(placed.payKey), false);
  assert.deepEqual(payload.providers, ['stripe']);
  assert.deepEqual(requestCancellation('  ').payload, { reason: 'withdrawn', unless: 'collecting' }, 'withdrawing is asked for at the door; the figure decides');
  assert.deepEqual(requestCancellation('the invoice expired', 'underWay'), { type: payFacts.cancellationRequested, payload: { reason: 'the invoice expired', unless: 'underWay' } });
});
