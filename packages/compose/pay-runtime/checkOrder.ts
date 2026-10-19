import { isDeepStrictEqual } from 'node:util';
import { figurePaths, foldStream, type OutboxEntry } from '@river/figure';
import { orderReading, payViewPaths } from '@river/pay-views';
import type { Doc } from '@river/store';
import { readHead, streamPaths, type Fact } from '@river/stream';
import { isOrderId } from './isOrderId.ts';
import type { PayRuntime } from './types/PayRuntime.ts';

/**
 * The replay check for one order: fold its stream again, from the first fact, and compare with what
 * is kept beside it. `view` says the cabinet's document equals the fold; `state` says the figure's
 * memory does; `outbox` says every intention has its outbox entry, answered exactly where the
 * stream holds its answer. Everything is read in one transaction — one moment of the store — so a
 * wave settling meanwhile cannot make a healthy order look broken.
 */
export async function checkOrder(runtime: PayRuntime, orderId: string): Promise<{ facts: number; view: boolean; state: boolean; outbox: boolean } | null> {
  if (!isOrderId(orderId)) return null;
  const { store, root, assembly } = runtime;
  const carrier = (fact: Fact) => assembly.controllers.find((c) => c.claims.includes(fact.type) && (!c.accepts || c.accepts(fact)));
  const moment = await store.transact(async (tx) => {
    const view = await tx.get<Doc>(payViewPaths.order(root, orderId));
    if (!view) return null;
    const head = await readHead(tx, root, orderId);
    const facts: Fact[] = [];
    for (let seq = 0; seq < head.nextSeq; seq += 1) {
      const fact = await tx.get<Fact>(streamPaths.fact(root, orderId, seq));
      if (fact) facts.push(fact);
    }
    const state = await tx.get<Doc>(figurePaths.state(root, orderId));
    const entries = new Map<number, OutboxEntry | null>();
    for (const fact of facts) {
      const controller = carrier(fact);
      if (controller) entries.set(fact.seq, await tx.get<OutboxEntry>(figurePaths.intention(root, controller.id, orderId, fact.seq)));
    }
    return { view, head, facts, state, entries };
  });
  if (!moment) return null;
  const replay = foldStream(assembly, moment.facts);
  const answered = new Set(moment.facts.flatMap((fact) => (fact.origin.via === 'world' && fact.origin.answering !== null ? [fact.origin.answering] : [])));
  const outbox = [...moment.entries].every(([seq, entry]) => entry !== null && entry.status === (answered.has(seq) ? 'done' : 'pending'));
  return {
    facts: moment.facts.length,
    view: moment.facts.length === moment.head.nextSeq && isDeepStrictEqual(replay.views[orderReading.id], moment.view),
    state: isDeepStrictEqual(replay.state, moment.state),
    outbox,
  };
}
