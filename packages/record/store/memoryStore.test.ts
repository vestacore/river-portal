import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from './createMemoryStore.ts';

test('memory store transactions are atomic and queries filter and order', async () => {
  const store = createMemoryStore();
  await store.transact(async (tx) => {
    tx.set('orgs/a/needs/1', { status: 'open', at: '2026-01-02' });
    tx.set('orgs/a/needs/2', { status: 'open', at: '2026-01-03' });
    tx.set('orgs/a/needs/3', { status: 'closed', at: '2026-01-01' });
    assert.deepEqual(await tx.get('orgs/a/needs/1'), { status: 'open', at: '2026-01-02' });
  });
  const open = await store.query('orgs/a/needs', { where: [{ field: 'status', op: '==', value: 'open' }], orderBy: { field: 'at', direction: 'desc' } });
  assert.deepEqual(open.map((d) => d.id), ['2', '1']);

  await assert.rejects(store.transact(async (tx) => { tx.create('orgs/a/needs/1', {}); tx.set('orgs/a/needs/9', {}); }));
  assert.equal(await store.get('orgs/a/needs/9'), null, 'failed transaction wrote nothing');
});
