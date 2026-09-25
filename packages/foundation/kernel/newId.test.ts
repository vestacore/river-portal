import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newId } from './newId.ts';

test('newId is prefixed, 26 characters after the prefix and time-ordered', () => {
  const a = newId('need', new Date('2026-01-01T00:00:00Z'));
  const b = newId('need', new Date('2026-01-02T00:00:00Z'));
  assert.match(a, /^need_[0-9A-HJKMNP-TV-Z]{26}$/);
  assert.ok(a < b);
});
