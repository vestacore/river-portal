import assert from 'node:assert/strict';
import { test } from 'node:test';
import { factDefinition, instrumentIds } from '@river/psp-facts';
import { acquirersFor, findInstrument, instrumentCatalogue, instrumentsFor } from './gate.ts';

test('every instrument is catalogued once and its course runs downstream, ending at the capture', () => {
  assert.deepEqual(instrumentCatalogue.map((i) => i.id).sort(), [...instrumentIds].sort());
  const order = ['choice', 'screening', 'routing', 'consent', 'secured', 'capture'];
  for (const instrument of instrumentCatalogue) {
    const stages = instrument.course.map((type) => factDefinition(type).stage ?? 'none');
    assert.equal(instrument.course.at(-1), 'capture.Completed', `${instrument.id} ends at the capture`);
    for (let i = 1; i < stages.length; i += 1) assert.ok(order.indexOf(stages[i]!) >= order.indexOf(stages[i - 1]!), `${instrument.id}: ${instrument.course[i]} does not flow upstream`);
    assert.ok(instrument.course.some((type) => type === 'authorisation.Approved' || type === 'funds.Received'), `${instrument.id}: a payment is born somewhere on its course`);
    assert.ok(acquirersFor(instrument.rail, instrument.regions[0]!).length > 0, `${instrument.id}: someone carries its rail`);
  }
});

test('the pay page offers what the unit allows, in its currency and region, in its order', () => {
  const offered = instrumentsFor(['card', 'qr_nbu', 'apple_pay', 'stablecoin'], ['qr_nbu', 'card'], 'UAH', 'UA').map((i) => i.id);
  assert.deepEqual(offered, ['qr_nbu', 'card', 'apple_pay'], 'stablecoins are not carried in UAH in Ukraine');
  assert.equal(findInstrument('voucher').push, true);
  assert.throws(() => findInstrument('cheque'));
});
