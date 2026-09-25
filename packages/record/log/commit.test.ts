import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '@river/store';
import { commit } from './commit.ts';
import type { Projector } from './types/Projector.ts';

test('commit appends events and runs matching projectors atomically', async () => {
  const store = createMemoryStore();
  const counter: Projector = {
    name: 'counter',
    handles: ['thing.Happened'],
    async project(event, tx) {
      const doc = (await tx.get<{ n: number }>(`orgs/${event.orgId}/views/counter`)) ?? { n: 0 };
      tx.set(`orgs/${event.orgId}/views/counter`, { n: doc.n + 1 });
    },
  };
  const env = { store, projectors: [counter], ctx: { orgId: 'o', actor: { personId: null, role: 'system' as const, via: 'system' as const } } };
  const events = await commit(env, [
    { type: 'thing.Happened', aggregate: { kind: 'thing', id: 't1' }, payload: {}, visibility: 'team' },
    { type: 'thing.Happened', aggregate: { kind: 'thing', id: 't1' }, payload: {}, visibility: 'team' },
  ]);
  assert.equal(events.length, 2);
  assert.equal(events[1]?.causationId, events[0]?.id);
  assert.deepEqual(await store.get('orgs/o/views/counter'), { n: 2 });
  assert.equal((await store.query('orgs/o/events')).length, 2);
});
