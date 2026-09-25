import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '@river/store';
import { submitNeed } from './submitNeed.ts';
import { triageNeed } from './triageNeed.ts';
import { needProjector } from './needProjector.ts';
import { readRecipientView } from './readRecipientView.ts';
import { readNeed } from './readNeed.ts';
import { validateNeedInput } from './validateNeedInput.ts';

const raw = {
  categoryId: 'energy', form: 'goods', description: 'Потрібен генератор, дзвоніть +380671234567', oblastId: 'kharkiv',
  settlement: 'Балаклія', forWhom: 'family', householdSize: '3', urgency: 'this_week', name: 'Олена',
  contactChannel: 'phone', contactValue: '+380 67 123 45 67', consentToContact: 'on', locale: 'uk',
};

test('a need is submitted, acknowledged, tracked by token and keeps PII out of the log', async () => {
  const input = validateNeedInput(raw);
  assert.ok(input.ok);
  const store = createMemoryStore();
  const env = { store, projectors: [needProjector], ctx: { orgId: 'o', actor: { personId: null, role: 'anonymous' as const, via: 'web' as const } } };
  const { needId, trackingToken } = await submitNeed(env, input.value);

  const view = await readRecipientView(store, 'o', trackingToken);
  assert.equal(view?.status, 'acknowledged');
  assert.deepEqual(view?.timeline.map((t) => t.code), ['submitted', 'acknowledged']);
  assert.equal(await readRecipientView(store, 'o', 'x'.repeat(43)), null);

  const events = await store.query('orgs/o/events');
  const serialised = JSON.stringify(events);
  for (const secret of ['Олена', '380', 'Балаклія', 'генератор', trackingToken]) assert.ok(!serialised.includes(secret), secret);

  const need = await readNeed(store, 'o', needId);
  assert.ok(need?.record.summary.includes('генератор'));
  assert.ok(!need?.record.summary.includes('380'));

  await triageNeed({ ...env, ctx: { ...env.ctx, actor: { personId: null, role: 'coordinator', via: 'studio' } } }, { needId });
  assert.equal((await readNeed(store, 'o', needId))?.record.status, 'open');
});

test('validation explains what is missing', () => {
  const result = validateNeedInput({ ...raw, contactValue: '12', consentToContact: undefined });
  assert.equal(result.ok, false);
  if (!result.ok) assert.deepEqual(result.errors.map((e) => e.field).sort(), ['consentToContact', 'contactValue']);
});
