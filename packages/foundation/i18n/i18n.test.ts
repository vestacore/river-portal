import { test } from 'node:test';
import assert from 'node:assert/strict';
import { oblastName } from './oblastName.ts';
import { pluralise } from './pluralise.ts';
import { formatMoney } from './formatMoney.ts';

test('Ukrainian oblast names take grammatical cases', () => {
  assert.equal(oblastName('kharkiv', 'uk', 'nom'), 'Харківська область');
  assert.equal(oblastName('kharkiv', 'uk', 'gen'), 'Харківської області');
  assert.equal(oblastName('kharkiv', 'uk', 'loc'), 'Харківській області');
  assert.equal(oblastName('kyiv-city', 'uk', 'loc'), 'Києві');
  assert.equal(oblastName('kharkiv', 'en-GB'), 'Kharkiv oblast');
});

test('Ukrainian plural categories are respected', () => {
  const forms = { one: '{n} родина', few: '{n} родини', many: '{n} родин', other: '{n} родини' };
  assert.equal(pluralise(1, 'uk', forms), '1 родина');
  assert.equal(pluralise(3, 'uk', forms), '3 родини');
  assert.equal(pluralise(5, 'uk', forms), '5 родин');
});

test('money formats whole amounts without decimals', () => {
  assert.equal(formatMoney(240000, 'GBP', 'en-GB'), '£2,400');
  assert.equal(formatMoney(1250, 'GBP', 'en-GB'), '£12.50');
});
