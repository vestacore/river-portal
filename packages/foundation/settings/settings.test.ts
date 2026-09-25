import { test } from 'node:test';
import assert from 'node:assert/strict';
import { definitions } from './data/definitions.ts';
import { profiles } from './data/profiles.ts';
import { resolveSettings } from './resolveSettings.ts';
import { validateSettingValue } from './validateSettingValue.ts';
import { findSettingDefinition } from './findSettingDefinition.ts';
import { contrastRatio } from './contrastRatio.ts';
import { readSettingFromForm } from './readSettingFromForm.ts';

test('every default and every profile value is valid for its definition', () => {
  for (const d of definitions) assert.ok(validateSettingValue(d, d.default).ok, `default of ${d.key}`);
  for (const profile of Object.values(profiles)) {
    for (const [key, value] of Object.entries(profile.values)) {
      const d = findSettingDefinition(key);
      assert.ok(d, `${profile.id}: unknown key ${key}`);
      const r = validateSettingValue(d, value);
      assert.ok(r.ok, `${profile.id}: ${key} → ${JSON.stringify(r.ok ? '' : r.errors)}`);
    }
  }
});

test('precedence is default → profile → custom, and unknown overrides are ignored', () => {
  const s = resolveSettings('city-foundation', { 'help.replyWithinDays': 5, 'no.such.key': 1 });
  assert.equal(s.values['help.replyWithinDays'], 5);
  assert.equal(s.sources['help.replyWithinDays'], 'custom');
  assert.equal(s.values['money.reportingCurrency'], 'UAH');
  assert.equal(s.sources['money.reportingCurrency'], 'profile');
  assert.equal(s.sources['home.feedCount'], 'default');
  assert.equal('no.such.key' in s.values, false);
});

test('canonical floors and accessibility guards cannot be bypassed', () => {
  const delay = findSettingDefinition('publication.safetyDelayDays');
  assert.ok(delay);
  assert.deepEqual(validateSettingValue(delay, 7), { ok: false, errors: [{ field: 'publication.safetyDelayDays', code: 'floor' }] });
  const accent = findSettingDefinition('appearance.accent');
  assert.ok(accent);
  assert.equal(validateSettingValue(accent, '#2a3137').ok, false, 'dark accent fails contrast with dark text');
  assert.ok(contrastRatio('#ffffff', '#000000') > 20);
});

test('studio forms are read into setting values', () => {
  const form = new Map<string, string>([
    ['e:home.doors:give', 'on'], ['o:home.doors:give', '1'], ['e:home.doors:ask', 'on'], ['o:home.doors:ask', '2'],
    ['v:help.referrals[0]:present', 'on'], ['v:help.referrals[0]:name:en-GB', 'Centre'], ['v:help.referrals[0]:name:uk', 'Центр'],
    ['v:help.referrals[0]:description:en-GB', 'x'], ['v:help.referrals[0]:description:uk', 'х'], ['v:help.referrals[0]:contact', '1'],
    ['v:money.costApprovalLimit', '250.50'],
  ]);
  const get = (n: string) => form.get(n);
  const reader = { get, getAll: () => [] };
  assert.deepEqual(readSettingFromForm(findSettingDefinition('home.doors')!, reader), ['give', 'ask']);
  assert.equal(readSettingFromForm(findSettingDefinition('money.costApprovalLimit')!, reader), 25050);
  assert.equal((readSettingFromForm(findSettingDefinition('help.referrals')!, reader) as unknown[]).length, 1);
});
