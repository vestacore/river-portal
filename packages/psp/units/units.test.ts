import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ancestorsOf, checkSetting, findPolicyDefinition, isWithin, nearestOfKind, resolvePolicy, subtreeOf, type PolicySetting, type Unit } from './gate.ts';

const unit = (id: string, parentId: string | null, kind: Unit['kind'], blockInheritance = false): Unit => ({
  id, parentId, kind, name: { 'en-GB': id, uk: id }, code: id, country: 'UA', currency: 'UAH', status: 'active', blockInheritance, mcc: null, channel: null, createdAt: '2026-01-01T00:00:00Z',
});
const units = [unit('root', null, 'platform'), unit('ua', 'root', 'entity'), unit('group', 'ua', 'holding'), unit('shop', 'group', 'merchant'), unit('till', 'shop', 'store'), unit('rebel', 'group', 'merchant', true)];
const set = (unitId: string, key: string, value: PolicySetting['value'], mode: PolicySetting['mode'] = 'default'): PolicySetting => ({ unitId, key, value, mode, setBy: 'test', setAt: '2026-01-01T00:00:00Z' });

test('the tree: a path from the root, a subtree, visibility and the nearest merchant', () => {
  assert.deepEqual(ancestorsOf(units, 'till').map((u) => u.id), ['root', 'ua', 'group', 'shop', 'till']);
  assert.deepEqual(subtreeOf(units, 'group').map((u) => u.id), ['group', 'shop', 'till', 'rebel']);
  assert.equal(isWithin(units, 'till', 'ua'), true);
  assert.equal(isWithin(units, 'ua', 'till'), false, 'a unit does not see above itself');
  assert.equal(nearestOfKind(units, 'till', 'merchant')?.id, 'shop');
});

test('a limit narrows downwards: a lower unit may lower it, never raise it', () => {
  const limit = findPolicyDefinition('limits.payment.max');
  const settings = [set('ua', limit.key, 500_000_00), set('shop', limit.key, 150_000_00), set('till', limit.key, 900_000_00)];
  const till = resolvePolicy(units, settings, 'till', limit);
  assert.equal(till.value, 150_000_00);
  assert.equal(till.source, 'shop');
  assert.deepEqual(till.chain.map((s) => s.outcome), ['applied', 'narrowed', 'looser']);
  assert.deepEqual(checkSetting(units, settings.slice(0, 2), set('till', limit.key, 900_000_00)), ['looser:shop']);
});

test('enforced wins over everything below it, even a block of inheritance', () => {
  const autonomy = findPolicyDefinition('agents.autonomy');
  const settings = [set('root', autonomy.key, 'propose', 'enforced'), set('shop', autonomy.key, 'act_low_risk'), set('rebel', autonomy.key, 'act_low_risk')];
  for (const id of ['shop', 'rebel']) {
    const resolved = resolvePolicy(units, settings, id, autonomy);
    assert.equal(resolved.value, 'propose');
    assert.equal(resolved.enforcedBy, 'root');
  }
  assert.deepEqual(checkSetting(units, settings.slice(0, 1), set('till', autonomy.key, 'act_low_risk')), ['enforced:root']);
});

test('a block of inheritance stops what was not enforced above', () => {
  const template = findPolicyDefinition('split.template');
  const settings = [set('group', template.key, 'marketplace')];
  assert.equal(resolvePolicy(units, settings, 'shop', template).value, 'marketplace');
  const rebel = resolvePolicy(units, settings, 'rebel', template);
  assert.equal(rebel.value, 'direct', 'back to the default');
  assert.deepEqual(rebel.chain.map((s) => s.outcome), ['blocked']);
});

test('instruments narrow as a subset; blocked countries grow as a union', () => {
  const allowed = findPolicyDefinition('instruments.allowed');
  const narrowed = resolvePolicy(units, [set('ua', allowed.key, ['card', 'apple_pay', 'qr_nbu']), set('shop', allowed.key, ['card', 'stablecoin'])], 'till', allowed);
  assert.deepEqual(narrowed.value, ['card'], 'a shop cannot add stablecoins the entity does not allow');
  const blocked = findPolicyDefinition('risk.countries.blocked');
  assert.deepEqual(resolvePolicy(units, [set('root', blocked.key, ['RU', 'BY'], 'enforced')], 'till', blocked).value, ['RU', 'BY']);
  assert.deepEqual(resolvePolicy(units, [set('ua', blocked.key, ['RU']), set('shop', blocked.key, ['IR'])], 'till', blocked).value, ['RU', 'IR']);
});
