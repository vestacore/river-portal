import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redactPii } from './redactPii.ts';
import { describeRecipientPublicly } from './describeRecipientPublicly.ts';
import { isVisibleAt } from './isVisibleAt.ts';

test('redactPii removes phones, emails, streets and names', () => {
  const out = redactPii('Олена, тел. +380 67 123 45 67, olena@example.com, вул. Шевченка 12', ['Олена']);
  assert.ok(!out.includes('Олена'));
  assert.ok(!out.includes('123 45 67'));
  assert.ok(!out.includes('example.com'));
  assert.ok(!out.includes('Шевченка'));
});

test('name stems match inflected forms, not other words', () => {
  assert.equal(redactPii('Дякуємо! Олена з Балаклії. Олені передали генератор.', ['Олена', 'Балаклія']), 'Дякуємо! […] з […]. […] передали генератор.');
  assert.equal(redactPii('3 kW petrol generator, new, boxed', ['Peter Walsh']), '3 kW petrol generator, new, boxed');
  assert.equal(redactPii('Peter and Peterborough', ['Peter']), '[…] and Peterborough');
});

test('public phrases are pseudonymised at oblast level', () => {
  assert.equal(describeRecipientPublicly('family', 'kharkiv', 'en-GB'), 'a family in Kharkiv oblast');
  assert.equal(describeRecipientPublicly('family', 'kharkiv', 'uk'), 'родина в Харківській області');
  assert.equal(describeRecipientPublicly('self', 'ivano-frankivsk', 'uk'), 'людина в Івано-Франківській області');
  assert.equal(describeRecipientPublicly('family', 'lviv', 'uk'), 'родина у Львівській області');
});

test('visibility ordering', () => {
  assert.ok(isVisibleAt('public', 'team'));
  assert.ok(!isVisibleAt('private', 'public'));
});
