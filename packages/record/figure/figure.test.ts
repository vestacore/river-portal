import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMemoryStore } from '@river/store';
import { readStream } from '@river/stream';
import { defineJoiner, defineListener, discharge, figurePaths, readOutbox, rebuildState, settle, type Assembly, type Controller, type FigureState } from './gate.ts';

// A tiny river: a wish and a gift must both arrive (the barrier); the bridge then asks the world
// to deliver; the world's answer closes the stream. A second wish opens a second round.
type Wishes = { count: number; last: string | null };
type Gift = { given: boolean };
type Delivered = { done: boolean };

const wishes = defineListener<Wishes>({
  id: 'wishes',
  hears: ['wish.Made'],
  init: { count: 0, last: null },
  step: (state, fact) => ({ count: state.count + 1, last: String(fact.payload.what) }),
  ready: (state) => state.count > 0,
});
const gift = defineListener<Gift>({ id: 'gift', hears: ['gift.Given'], init: { given: false }, step: () => ({ given: true }), ready: (state) => state.given });
const delivered = defineListener<Delivered>({ id: 'delivered', hears: ['delivery.Done'], init: { done: false }, step: () => ({ done: true }), ready: (state) => state.done });

const bridge = defineJoiner<{ wish: Wishes; gift: Gift }>({
  id: 'bridge',
  demands: { wish: 'wishes', gift: 'gift' },
  round: (scope) => `wish-${scope.wish.count}`,
  emit: (scope) => [{ type: 'delivery.Requested', payload: { what: scope.wish.last } }],
});
const thanks = defineJoiner<{ delivered: Delivered }>({ id: 'thanks', demands: { delivered: 'delivered' }, emit: () => [{ type: 'thanks.Sent', payload: {} }] });

function assemblyWith(world: Partial<Controller> = {}): Assembly {
  const carrier: Controller = {
    id: 'carrier',
    claims: ['delivery.Requested'],
    discharge: async (intention, key) => [{ type: 'delivery.Done', payload: { what: intention.payload.what, key } }],
    exhausted: (_intention, reason) => [{ type: 'delivery.Failed', payload: { reason } }],
    ...world,
  };
  return {
    listeners: [wishes, gift, delivered],
    joiners: [bridge, thanks],
    controllers: [carrier],
    readings: [
      {
        id: 'summary',
        hears: ['wish.Made', 'delivery.Done', 'delivery.Failed'],
        path: (root, stream) => `${root}/summaries/${stream}`,
        project: (view, fact) => ({ ...(view ?? { wishes: 0, delivered: 0, failed: 0 }), ...(fact.type === 'wish.Made' ? { wishes: Number(view?.wishes ?? 0) + 1 } : fact.type === 'delivery.Done' ? { delivered: Number(view?.delivered ?? 0) + 1 } : { failed: Number(view?.failed ?? 0) + 1 }) }),
      },
    ],
  };
}

const door = (type: string, payload: Record<string, unknown> = {}) => ({ draft: { type, payload }, origin: { via: 'door' as const, actor: 'p1', role: 'person' }, causedBy: null });
const root = 'orgs/test';
const types = async (store: ReturnType<typeof createMemoryStore>, stream: string) => (await readStream(store, root, stream)).map((f) => `${f.seq}:${f.type}`);

test('a wave settles to quiescence: the barrier holds until every demand is ready, then the bridge crosses once', async () => {
  const store = createMemoryStore();
  const assembly = assemblyWith();
  const first = await settle(store, root, assembly, { stream: 's1', entering: [door('wish.Made', { what: 'a blanket' })] });
  assert.deepEqual(first.facts.map((f) => f.type), ['wish.Made'], 'one demand ready is not enough');
  assert.equal(first.intentions.length, 0);

  const second = await settle(store, root, assembly, { stream: 's1', entering: [door('gift.Given')] });
  assert.deepEqual(second.facts.map((f) => [f.seq, f.type, f.origin.via, f.causedBy, f.wave]), [[1, 'gift.Given', 'door', null, 1], [2, 'delivery.Requested', 'figure', 1, 1]]);
  assert.deepEqual(second.intentions, [{ controller: 'carrier', seq: 2 }], 'the intention waits in the outbox, written with the fragment');

  const again = await settle(store, root, assembly, { stream: 's1', entering: [door('gift.Given')] });
  assert.deepEqual(again.facts.map((f) => f.type), ['gift.Given'], 'the bridge has crossed this round; it does not cross again');
});

test('an intention crosses the bank exactly once; its answer names it and wakes the next figure', async () => {
  const store = createMemoryStore();
  let calls = 0;
  const assembly = assemblyWith({ discharge: async (intention, key) => { calls += 1; return [{ type: 'delivery.Done', payload: { what: intention.payload.what, key } }]; } });
  await settle(store, root, assembly, { stream: 's2', entering: [door('wish.Made', { what: 'a stove' }), door('gift.Given')] });
  assert.equal((await readOutbox(store, root, assembly)).length, 1);

  const answer = await discharge(store, root, assembly, { controller: 'carrier', stream: 's2', seq: 2 });
  assert.deepEqual(answer?.facts.map((f) => [f.type, f.origin.via, f.causedBy]), [['delivery.Done', 'world', 2], ['thanks.Sent', 'figure', 3]]);
  assert.deepEqual(answer?.facts[0]?.origin, { via: 'world', controller: 'carrier', answering: 2 });
  assert.equal(answer?.facts[0]?.payload.key, 's2-2', 'the world is given a stable idempotency key');

  assert.equal(await discharge(store, root, assembly, { controller: 'carrier', stream: 's2', seq: 2 }), null, 'a second delivery of the same message does nothing');
  assert.equal(calls, 1);
  assert.equal((await readOutbox(store, root, assembly)).length, 0);
  assert.deepEqual(await types(store, 's2'), ['0:wish.Made', '1:gift.Given', '2:delivery.Requested', '3:delivery.Done', '4:thanks.Sent']);
});

test('a new round crosses again; the same act entering twice writes nothing', async () => {
  const store = createMemoryStore();
  const assembly = assemblyWith();
  await settle(store, root, assembly, { stream: 's3', entering: [door('wish.Made', { what: 'one' }), door('gift.Given')] });
  const more = await settle(store, root, assembly, { stream: 's3', actKey: 'wish-2', entering: [door('wish.Made', { what: 'two' })] });
  assert.deepEqual(more.facts.map((f) => f.type), ['wish.Made', 'delivery.Requested'], 'a second wish is a second round');
  const repeat = await settle(store, root, assembly, { stream: 's3', actKey: 'wish-2', entering: [door('wish.Made', { what: 'two' })] });
  assert.equal(repeat.duplicate, true);
  assert.equal(repeat.facts.length, 0);
});

test('the world failing: retried by the caller, then the failure itself becomes a fact', async () => {
  const store = createMemoryStore();
  const assembly = assemblyWith({ discharge: async () => { throw new Error('the bridge is out'); } });
  await settle(store, root, assembly, { stream: 's4', entering: [door('wish.Made', { what: 'x' }), door('gift.Given')] });
  const ref = { controller: 'carrier', stream: 's4', seq: 2 };
  await assert.rejects(discharge(store, root, assembly, ref), /the bridge is out/);
  await assert.rejects(discharge(store, root, assembly, ref), /the bridge is out/);
  const last = await discharge(store, root, assembly, ref);
  assert.deepEqual(last?.facts.map((f) => [f.type, f.payload.reason]), [['delivery.Failed', 'the bridge is out']]);
  assert.equal((await store.get<{ status: string; attempts: number }>(figurePaths.intention(root, 'carrier', 's4', 2)))?.status, 'done');
});

test('overlapping deliveries: one answers, one fails late — the intention stays answered and the world is not asked again', async () => {
  const store = createMemoryStore();
  let calls = 0;
  let failLate!: () => void;
  const slow = new Promise<void>((resolve) => { failLate = resolve; });
  const assembly = assemblyWith({
    discharge: async (intention) => {
      calls += 1;
      if (calls === 2) { await slow; throw new Error('the connection was reset'); }
      return [{ type: 'delivery.Done', payload: { what: intention.payload.what } }];
    },
  });
  await settle(store, root, assembly, { stream: 's7', entering: [door('wish.Made', { what: 'a' }), door('gift.Given')] });
  const ref = { controller: 'carrier', stream: 's7', seq: 2 };
  const first = discharge(store, root, assembly, ref);
  const second = discharge(store, root, assembly, ref);
  assert.deepEqual((await first)?.facts.map((f) => f.type), ['delivery.Done', 'thanks.Sent']);
  failLate();
  assert.equal(await second, null, 'the late failure finds the intention answered and says nothing');
  assert.deepEqual([(await store.get<{ status: string; attempts: number }>(figurePaths.intention(root, 'carrier', 's7', 2)))?.status, (await readOutbox(store, root, assembly)).length], ['done', 0]);
  assert.equal(await discharge(store, root, assembly, ref), null);
  assert.equal(calls, 2, 'no further call to the world');

  // Both deliveries answer: the second answer is a duplicate, and the entry is closed whichever settles first.
  const both = assemblyWith();
  await settle(store, root, both, { stream: 's8', entering: [door('wish.Made', { what: 'b' }), door('gift.Given')] });
  const twice = await Promise.all([discharge(store, root, both, { controller: 'carrier', stream: 's8', seq: 2 }), discharge(store, root, both, { controller: 'carrier', stream: 's8', seq: 2 })]);
  assert.deepEqual(twice.map((r) => r?.duplicate).sort(), [false, true]);
  assert.deepEqual([(await types(store, 's8')).length, (await readOutbox(store, root, both)).length], [5, 0], 'one answer in the stream, nothing left waiting');
});

test('an unknown outcome is never called a failure: the intention keeps waiting, and a later answer still enters', async () => {
  const store = createMemoryStore();
  let down = true;
  const assembly = assemblyWith({
    discharge: async (intention) => { if (down) throw new Error('no answer'); return [{ type: 'delivery.Done', payload: { what: intention.payload.what } }]; },
    exhausted: () => null,
  });
  await settle(store, root, assembly, { stream: 's9', entering: [door('wish.Made', { what: 'x' }), door('gift.Given')] });
  const ref = { controller: 'carrier', stream: 's9', seq: 2 };
  for (let i = 0; i < 5; i += 1) await assert.rejects(discharge(store, root, assembly, ref), /no answer/);
  assert.deepEqual([(await readOutbox(store, root, assembly))[0]?.attempts, (await types(store, 's9')).length], [5, 3], 'five attempts counted, no fact invented');
  down = false;
  assert.deepEqual((await discharge(store, root, assembly, ref))?.facts.map((f) => f.type), ['delivery.Done', 'thanks.Sent']);
});

test('an intention no mounted controller accepts is a defect, loudly: the wave is not written', async () => {
  const store = createMemoryStore();
  const assembly = assemblyWith({ accepts: (intention) => intention.payload.what !== 'a piano' });
  await assert.rejects(settle(store, root, assembly, { stream: 's10', entering: [door('wish.Made', { what: 'a piano' }), door('gift.Given')] }), /no mounted controller accepts the intention delivery.Requested/);
  assert.deepEqual(await readStream(store, root, 's10'), []);
});

test('the caches equal a fold of the truth: state and views rebuild from the stream alone', async () => {
  const store = createMemoryStore();
  const assembly = assemblyWith();
  await settle(store, root, assembly, { stream: 's5', entering: [door('wish.Made', { what: 'a' })] });
  await settle(store, root, assembly, { stream: 's5', entering: [door('gift.Given')] });
  await discharge(store, root, assembly, { controller: 'carrier', stream: 's5', seq: 2 });
  await settle(store, root, assembly, { stream: 's5', entering: [door('wish.Made', { what: 'b' })] });

  const rebuilt = await rebuildState(store, root, assembly, 's5');
  assert.deepEqual(rebuilt.state, await store.get<FigureState>(figurePaths.state(root, 's5')));
  assert.deepEqual(rebuilt.views.summary, await store.get(`${root}/summaries/s5`));
  const seqs = (await readStream(store, root, 's5')).map((f) => f.seq);
  assert.deepEqual(seqs, seqs.map((_, i) => i), 'the stream is dense');
});

test('streams do not touch: two keys settle independently, each dense from zero', async () => {
  const store = createMemoryStore();
  const assembly = assemblyWith();
  await Promise.all(['a', 'b'].flatMap((stream) => [settle(store, root, assembly, { stream, entering: [door('wish.Made', { what: stream })] }), settle(store, root, assembly, { stream, entering: [door('gift.Given')] })]));
  for (const stream of ['a', 'b']) assert.deepEqual((await readStream(store, root, stream)).map((f) => f.seq), [0, 1, 2]);
});

test('a runaway figure is a defect, loudly', async () => {
  const store = createMemoryStore();
  const echo = defineListener<{ n: number }>({ id: 'echo', hears: ['ping.Sent'], init: { n: 0 }, step: (s) => ({ n: s.n + 1 }), ready: (s) => s.n > 0 });
  const loop = defineJoiner<{ echo: { n: number } }>({ id: 'loop', demands: { echo: 'echo' }, round: (scope) => String(scope.echo.n), emit: () => [{ type: 'ping.Sent', payload: {} }] });
  await assert.rejects(settle(store, root, { listeners: [echo], joiners: [loop], controllers: [], readings: [] }, { stream: 's6', entering: [door('ping.Sent')] }), /wrote more than/);
  assert.deepEqual(await readStream(store, root, 's6'), [], 'nothing of a failed wave is written');
});
