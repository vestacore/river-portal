import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plainToRichDoc } from './plainToRichDoc.ts';
import { renderRichText } from './renderRichText.ts';

test('default texts support headings and bullet lists, safely', () => {
  const html = renderRichText(plainToRichDoc('## What we collect\n\n- your name\n- <b>contact</b>\n\nThat is all.'), 'rich');
  assert.equal(html, '<h2>What we collect</h2><ul><li><p>your name</p></li><li><p>&lt;b&gt;contact&lt;/b&gt;</p></li></ul><p>That is all.</p>');
});
