import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Unit } from '@river/psp-units';
import { effectiveRules, matchRule, scoreAttempt, screenName, type RiskRule, type RiskSignals } from './gate.ts';

const quiet: RiskSignals = { amountMinor: 50_000, currency: 'UAH', typicalMinor: 60_000, instrument: 'card', payerCountry: 'UA', issuerCountry: 'UA', blockedCountries: ['RU', 'BY'], attempts24h: 0, amount24hMinor: 0, newPayer: false, hour: 14, mccRisk: 'low', reportThresholdMinor: 40_000_000 };

test('the score is explained and deterministic; thresholds decide', () => {
  assert.deepEqual(scoreAttempt(quiet, 75, 92), { score: 8, level: 'low', reasons: [], decision: 'pass' });
  const blocked = scoreAttempt({ ...quiet, issuerCountry: 'RU' }, 75, 92);
  assert.equal(blocked.decision, 'block');
  assert.ok(blocked.reasons.includes('blocked_country'));
  const report = scoreAttempt({ ...quiet, amountMinor: 45_000_000, typicalMinor: 60_000 }, 75, 92);
  assert.ok(report.reasons.includes('threshold') && report.level !== 'low', 'a threshold payment is reported, not necessarily held');
  const structured = scoreAttempt({ ...quiet, amountMinor: 30_000_000, amount24hMinor: 25_000_000 }, 75, 92);
  assert.ok(structured.reasons.includes('structuring'));
});

test('rules accumulate down the tree; enforced rules cannot be switched off below', () => {
  const unit = (id: string, parentId: string | null): Unit => ({ id, parentId, kind: 'merchant', name: { 'en-GB': id, uk: id }, code: id, country: 'UA', currency: 'UAH', status: 'active', blockInheritance: false, mcc: null, channel: null, createdAt: '' });
  const units = [unit('root', null), unit('ua', 'root'), unit('shop', 'ua')];
  const rule = (id: string, unitId: string, priority: number, extra: Partial<RiskRule> = {}): RiskRule => ({ id, unitId, name: { 'en-GB': id, uk: id }, priority, enabled: true, enforced: false, action: 'review', target: null, compose: 'and', conditions: [], ...extra });
  const rules = [rule('geo', 'root', 10, { enforced: true }), rule('big', 'ua', 20), rule('geo', 'shop', 10, { enabled: false }), rule('big', 'shop', 20, { enabled: false }), rule('own', 'shop', 5)];
  assert.deepEqual(effectiveRules(units, rules, 'shop').map((r) => `${r.id}@${r.unitId}`), ['own@shop', 'geo@root']);
  const big = rule('big', 'ua', 20, { conditions: [{ field: 'amount', op: 'ge', value: 1_000_000 }, { field: 'instrument', op: 'in', value: ['card', 'apple_pay'] }] });
  assert.equal(matchRule(big, { ...quiet, score: 10, amountMinor: 1_500_000 }), true);
  assert.equal(matchRule(big, { ...quiet, score: 10, amountMinor: 1_500_000, instrument: 'qr_nbu' }), false);
});

test('screening matches invented list names, ignoring case and company forms', () => {
  assert.deepEqual(screenName('NORD ICE LOGISTICS'), ['Nord Ice Logistics FZE']);
  assert.deepEqual(screenName('Kvitka Market'), []);
});
