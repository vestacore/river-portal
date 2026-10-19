import { nowIso } from '@river/kernel';
import type { Doc, DocStore, DocTransaction } from '@river/store';
import { commitFacts, readHead } from '@river/stream';
import { figurePaths } from './paths.ts';
import { runWave } from './runWave.ts';
import type { Assembly } from './types/Assembly.ts';
import type { Entering } from './types/Entering.ts';
import type { FigureState } from './types/FigureState.ts';
import type { OutboxEntry } from './types/OutboxEntry.ts';
import type { Receipt } from './types/Receipt.ts';

/**
 * Lets drafts enter one stream and settles the wave they cause, in one transaction: the fragment,
 * the listeners' state, the views that fold it, and an outbox entry for every intention a
 * controller claims — written together or not at all. `actKey` makes an act idempotent: the same
 * key entering twice writes nothing the second time. `also` adds further reads and writes to the
 * transaction. A wave that writes an intention no mounted controller accepts fails as a whole.
 */
export async function settle(
  store: DocStore,
  root: string,
  assembly: Assembly,
  input: { stream: string; entering: readonly Entering[]; at?: string; actKey?: string; also?: (tx: DocTransaction) => void | Promise<void> },
): Promise<Receipt> {
  const at = input.at ?? nowIso();
  return store.transact(async (tx) => {
    if (input.actKey) {
      const seen = await tx.get(figurePaths.act(root, input.stream, input.actKey));
      if (seen) return { stream: input.stream, wave: (seen as { wave: number }).wave, facts: [], intentions: [], duplicate: true };
    }
    const head = await readHead(tx, root, input.stream);
    const stored = await tx.get<FigureState>(figurePaths.state(root, input.stream));
    const state: FigureState = stored ?? { upToSeq: -1, listeners: {}, fired: {} };
    if (state.upToSeq !== head.nextSeq - 1) throw new Error(`Stream ${input.stream}: the figure state is at ${state.upToSeq}, the stream at ${head.nextSeq - 1}; rebuild it`);

    const wave = runWave(assembly, state, head, input.entering, at);
    commitFacts(tx, root, head, wave.facts, at);
    tx.set(figurePaths.state(root, input.stream), wave.state);
    if (input.actKey) tx.set(figurePaths.act(root, input.stream, input.actKey), { wave: head.waves, at });

    for (const reading of assembly.readings) {
      const heard = wave.facts.filter((fact) => reading.hears.includes(fact.type));
      if (heard.length === 0) continue;
      const path = reading.path(root, input.stream);
      let view: Doc | null = await tx.get(path);
      for (const fact of heard) view = reading.project(view, fact);
      if (view) tx.set(path, view);
      else tx.delete(path);
    }

    const intentions: Receipt['intentions'] = [];
    for (const fact of wave.facts) {
      const claiming = assembly.controllers.filter((c) => c.claims.includes(fact.type));
      if (claiming.length === 0) continue;
      const controller = claiming.find((c) => !c.accepts || c.accepts(fact));
      // An intention that no mounted bank would carry must not be written: it would wait for ever, unseen.
      if (!controller) throw new Error(`Stream ${input.stream}: no mounted controller accepts the intention ${fact.type}`);
      const entry: OutboxEntry = { controller: controller.id, stream: fact.stream, seq: fact.seq, type: fact.type, status: 'pending', attempts: 0, lastError: null, at };
      tx.create(figurePaths.intention(root, controller.id, fact.stream, fact.seq), entry);
      intentions.push({ controller: controller.id, seq: fact.seq });
    }

    if (input.also) await input.also(tx);
    return { stream: input.stream, wave: head.waves, facts: wave.facts, intentions, duplicate: false };
  });
}
