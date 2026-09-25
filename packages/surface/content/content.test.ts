import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderRichText } from './renderRichText.ts';
import { plainToRichDoc } from './plainToRichDoc.ts';
import { richDocToPlain } from './richDocToPlain.ts';

test('rich text renders an allow-list and escapes everything else', () => {
  const html = renderRichText({
    type: 'doc',
    content: [
      { type: 'paragraph', content: [
        { type: 'text', text: '<script>alert(1)</script>' },
        { type: 'text', text: 'site', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] },
        { type: 'text', text: 'ok', marks: [{ type: 'link', attrs: { href: 'https://example.org' } }, { type: 'bold' }] },
      ] },
      { type: 'iframe', content: [{ type: 'text', text: 'x' }] },
    ],
  }, 'rich');
  assert.equal(html, '<p>&lt;script&gt;alert(1)&lt;/script&gt;site<strong><a href="https://example.org" rel="noopener nofollow">ok</a></strong></p>x');
});

test('plain text round-trips through rich documents', () => {
  const doc = plainToRichDoc('First line\nsecond\n\nNext paragraph');
  assert.equal(renderRichText(doc, 'rich'), '<p>First line<br>second</p><p>Next paragraph</p>');
  assert.equal(richDocToPlain(doc), 'First line\nsecond\n\nNext paragraph');
});
