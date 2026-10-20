import assert from 'node:assert/strict';
import { test } from 'node:test';
import { boundaries, factCatalogue, factDefinition, factsFormingOf, isFactType, stageCatalogue, stages } from './gate.ts';

test('every fact type is listed once, with an owner, a speaker and both languages', () => {
  const types = factCatalogue.map((d) => d.type);
  assert.equal(new Set(types).size, types.length, 'no type is listed twice');
  for (const d of factCatalogue) {
    assert.ok((boundaries as readonly string[]).includes(d.owner), `${d.type} has an owner`);
    assert.ok(d.label['en-GB'] && d.label.uk && d.meaning['en-GB'] && d.meaning.uk, `${d.type} speaks both languages`);
    assert.ok(d.forms.length > 0, `${d.type} forms at least one projection`);
    assert.equal(d.type.split('.').length, 2, `${d.type} is aggregate.PastTense`);
  }
  assert.equal(isFactType('capture.Completed'), true);
  assert.equal(isFactType('capture.completed'), false);
  assert.throws(() => factDefinition('nothing.Happened'));
});

test('a boundary writes only into its own stream: bridges are the session’s, after-life is the payment’s', () => {
  for (const d of factCatalogue) {
    if (d.stage !== null) assert.equal(d.owner, 'session', `${d.type} stands on the river, so the session owns it`);
    if (d.ends !== null) assert.equal(d.owner, 'session', `${d.type} ends an attempt`);
  }
  assert.equal(factDefinition('refund.Completed').owner, 'payment');
  assert.equal(factDefinition('invoice.Issued').owner, 'invoice');
  assert.equal(factDefinition('order.Created').owner, 'order');
});

test('the mouth is where unpaid becomes paid: capture forms the invoice and the order', () => {
  assert.deepEqual([...factDefinition('capture.Completed').forms].sort(), ['invoice', 'order', 'payment', 'session']);
  assert.ok(factsFormingOf('ledger').includes('split.Allocated'));
  assert.ok(!factsFormingOf('ledger').includes('capture.Completed'), 'the ledger forms from the split, not from the capture');
  assert.deepEqual(stageCatalogue.map((s) => s.stage), [...stages]);
});
