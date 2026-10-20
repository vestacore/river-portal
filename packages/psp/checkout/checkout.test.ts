import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cardBrand, cardErrors, checkoutTexts, formatCardNumber, luhnValid, testCards } from './gate.ts';

const now = new Date('2026-10-19T12:00:00Z');

test('card checks run in the order a payer fixes them, and only test cards pass in the demo', () => {
  assert.deepEqual(cardErrors({ number: '4242 4242 4242 4242', expiry: '12/29', cvc: '123' }, now), []);
  assert.deepEqual(cardErrors({ number: '4242 4242', expiry: '12/29', cvc: '123' }, now), ['number_incomplete']);
  assert.deepEqual(cardErrors({ number: '4242 4242 4242 4241', expiry: '1/2', cvc: '12' }, now), ['number_invalid', 'expiry_incomplete', 'cvc_incomplete']);
  assert.deepEqual(cardErrors({ number: '4111 1111 1111 1111', expiry: '09/26', cvc: '123' }, now), ['not_a_test_card', 'expiry_invalid']);
  assert.equal(luhnValid(''), false, 'an empty number does not pass the Luhn check');
  for (const card of testCards) assert.ok(luhnValid(card.number) && cardBrand(card.number) === card.brand, card.number);
  assert.equal(formatCardNumber('4242424242424242'), '4242 4242 4242 4242');
  assert.equal(cardBrand('9804 0000'), 'prostir');
});

test('the payer’s texts exist in both languages, key for key', () => {
  const keys = (o: object): string[] => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' && !Array.isArray(v) ? keys(v).map((x) => `${k}.${x}`) : [k]));
  assert.deepEqual(keys(checkoutTexts.uk), keys(checkoutTexts['en-GB']));
});
