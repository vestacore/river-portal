import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { CommandEnv } from '@river/log';
import { resolveSettings } from '@river/settings';
import { createMemoryStore } from '@river/store';
import { applyProfile } from './applyProfile.ts';
import { changeSettings } from './changeSettings.ts';
import { configProjector } from './configProjector.ts';
import { readSettings } from './readSettings.ts';
import { resetSetting } from './resetSetting.ts';

test('settings: a profile, a custom value, an unchanged value and a reset', async () => {
  const store = createMemoryStore();
  const env = async (): Promise<CommandEnv> => ({
    store, projectors: [configProjector], settings: await readSettings(store, 'o', 'small-nationwide'),
    ctx: { orgId: 'o', actor: { personId: 'person_iryna', role: 'administrator', via: 'studio' } },
  });
  await applyProfile(await env(), { profileId: 'city-foundation', keepOverrides: false });
  let settings = await readSettings(store, 'o', 'small-nationwide');
  assert.equal(settings.profileId, 'city-foundation');
  assert.equal(settings.sources['money.reportingCurrency'], 'profile');

  const current = settings.values['home.sections'];
  const saved = await changeSettings(await env(), { values: { 'home.sections': current, 'home.feedCount': 5, 'appearance.accent': '#1e3a8a' } });
  assert.equal(saved.ok, false, 'too little contrast: nothing is applied');
  assert.equal((await readSettings(store, 'o', 'small-nationwide')).sources['home.feedCount'], resolveSettings('city-foundation', {}).sources['home.feedCount']);

  assert.equal((await changeSettings(await env(), { values: { 'home.sections': current, 'home.feedCount': 5 } })).ok, true);
  settings = await readSettings(store, 'o', 'small-nationwide');
  assert.equal(settings.sources['home.feedCount'], 'custom');
  assert.notEqual(settings.sources['home.sections'], 'custom', 'an unchanged value keeps its source');

  await resetSetting(await env(), { key: 'home.feedCount' });
  assert.notEqual((await readSettings(store, 'o', 'small-nationwide')).sources['home.feedCount'], 'custom');
});
