import assert from 'node:assert/strict';
import { test } from 'node:test';
import { acquiringCostOf, type AcquiringTerms } from './gate.ts';

const t = (en: string) => ({ 'en-GB': en, uk: en });
const blended: AcquiringTerms = { id: 'a', acquirerId: 'acq-x', merchantId: 'm', channel: 'online', model: 'blended', blendedBps: 115, markupBps: null, fixedMinor: 0, onUsBps: null, contractId: null, note: t('') };
const icpp: AcquiringTerms = { ...blended, id: 'b', model: 'ic_plus_plus', blendedBps: null, markupBps: 25, onUsBps: 55 };
const debit = { scheme: 'visa', product: 'debit', domestic: true, onUs: false };

test('a blended rate is one figure; IC++ shows interchange, the scheme fee and the markup', () => {
  assert.deepEqual(acquiringCostOf(blended, debit, 100_000), { model: 'blended', interchangeMinor: null, schemeMinor: null, markupMinor: null, totalMinor: 1_150 });
  assert.deepEqual(acquiringCostOf(icpp, debit, 100_000), { model: 'ic_plus_plus', interchangeMinor: 900, schemeMinor: 120, markupMinor: 250, totalMinor: 1_270 });
  assert.equal(acquiringCostOf(icpp, { ...debit, product: 'premium' }, 100_000).interchangeMinor, 1_200, 'premium consumer cards stay under the 1.2 % cap');
  assert.equal(acquiringCostOf(icpp, { ...debit, domestic: false }, 100_000).interchangeMinor, 1_800, 'a cross-border card is not under the cap');
  assert.equal(acquiringCostOf(icpp, { ...debit, scheme: 'prostir' }, 100_000).totalMinor, 600 + 50 + 250);
});

test('an on-us card is priced by the on-us clause, and only where there is one', () => {
  assert.deepEqual(acquiringCostOf(icpp, { ...debit, onUs: true }, 100_000), { model: 'on_us', interchangeMinor: 0, schemeMinor: null, markupMinor: null, totalMinor: 550 });
  assert.equal(acquiringCostOf(blended, { ...debit, onUs: true }, 100_000).totalMinor, 1_150, 'without the clause the bank keeps the difference');
  assert.equal(acquiringCostOf({ ...blended, fixedMinor: 500 }, debit, 100).totalMinor, 100, 'never more than the amount');
  assert.throws(() => acquiringCostOf(blended, debit, 10.5));
});
