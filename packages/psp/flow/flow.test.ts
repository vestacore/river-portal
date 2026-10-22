import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chooseRoute } from './gate.ts';

const available = ['acq-dnipro', 'acq-karpaty', 'acq-stepove'];
const quotes = [
  { acquirer: 'acq-dnipro', feeMinor: 550, onUs: true },
  { acquirer: 'acq-stepove', feeMinor: 1_050, onUs: false },
  { acquirer: 'acq-karpaty', feeMinor: 990, onUs: false },
];

test('on-us first takes the card’s own bank; least cost the cheapest; both keep to the approval threshold', () => {
  const base = { rail: 'card' as const, region: 'UA' as const, sessionId: 'ps_1', routeTo: null, available, quotes, minApprovalBps: 9_000 };
  const onUs = chooseRoute({ ...base, strategy: 'on_us_first' });
  assert.equal(onUs.acquirer, 'acq-dnipro');
  assert.equal(onUs.rule, 'on-us');
  assert.equal(onUs.onUs, true);
  assert.equal(onUs.feeMinor, 550);
  assert.equal(onUs.alternatives.length, 3);
  assert.equal(onUs.alternatives.find((a) => a.acquirer === 'acq-karpaty')?.eligible, false, 'Karpaty approves 88 %, below the threshold');
  const cheapest = chooseRoute({ ...base, strategy: 'least_cost', quotes: quotes.map((q) => ({ ...q, onUs: false, feeMinor: q.acquirer === 'acq-dnipro' ? 1_150 : q.feeMinor })) });
  assert.equal(cheapest.acquirer, 'acq-stepove', 'Karpaty is cheaper but below the threshold');
  assert.equal(chooseRoute({ ...base, strategy: 'least_cost', minApprovalBps: 8_000, quotes: quotes.map((q) => ({ ...q, onUs: false })) }).acquirer, 'acq-dnipro');
});

test('a rule of the unit wins; with no quotes the strategy falls back to approval first, the same way on replay', () => {
  const base = { rail: 'card' as const, region: 'UA' as const, sessionId: 'ps_2', available };
  assert.equal(chooseRoute({ ...base, routeTo: 'acq-karpaty', strategy: 'on_us_first', quotes }).rule, 'rule:route→acq-karpaty');
  const a = chooseRoute({ ...base, routeTo: null, strategy: 'least_cost' });
  assert.equal(a.rule, 'fallback:approval-first');
  assert.deepEqual(chooseRoute({ ...base, routeTo: null, strategy: 'least_cost' }), a);
  assert.equal(chooseRoute({ ...base, routeTo: null }).rule, 'best-approval-first');
});
