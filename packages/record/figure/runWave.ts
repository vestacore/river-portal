import type { Doc } from '@river/store';
import type { Fact, StreamHead } from '@river/stream';
import { waveBudget } from './data/limits.ts';
import type { Assembly } from './types/Assembly.ts';
import type { Entering } from './types/Entering.ts';
import type { FigureState } from './types/FigureState.ts';

/**
 * One wave, as a pure function: the entering drafts become facts in order; every fact is folded
 * into the listeners that hear it; every joiner whose demands are all ready — and whose round has
 * not crossed yet — emits, and what it emits is queued behind what is already waiting. The wave
 * ends when nothing is left to write (quiescence). No clock, no randomness, no I/O: the same
 * state and the same drafts always give the same fragment.
 */
export function runWave(assembly: Assembly, state: FigureState, head: StreamHead, entering: readonly Entering[], at: string): { facts: Fact[]; state: FigureState } {
  const listeners: Record<string, Doc> = structuredClone(state.listeners);
  const fired: Record<string, number> = { ...state.fired };
  const byId = new Map(assembly.listeners.map((listener) => [listener.id, listener]));
  const queue: Entering[] = [...entering];
  const facts: Fact[] = [];
  let seq = head.nextSeq;

  while (queue.length > 0) {
    const next = queue.shift() as Entering;
    if (facts.length >= waveBudget) throw new Error(`Stream ${head.stream}: a wave wrote more than ${waveBudget} facts`);
    const fact: Fact = { stream: head.stream, seq, type: next.draft.type, payload: next.draft.payload, origin: next.origin, wave: head.waves, causedBy: next.causedBy, at };
    facts.push(fact);
    seq += 1;

    for (const listener of assembly.listeners) {
      if (listener.hears.includes(fact.type)) listeners[listener.id] = listener.step(listeners[listener.id] ?? listener.init, fact);
    }

    for (const joiner of assembly.joiners) {
      const scope: Record<string, Doc> = {};
      let ready = true;
      for (const [name, listenerId] of Object.entries(joiner.demands)) {
        const listener = byId.get(listenerId);
        if (!listener) throw new Error(`Joiner ${joiner.id} demands an unknown listener ${listenerId}`);
        const current = listeners[listenerId] ?? listener.init;
        if (!listener.ready(current)) { ready = false; break; }
        scope[name] = current;
      }
      if (!ready) continue;
      const key = `${joiner.id}:${joiner.round ? joiner.round(scope) : 'once'}`;
      if (key in fired) continue;
      fired[key] = fact.seq;
      for (const draft of joiner.emit(scope)) queue.push({ draft, origin: { via: 'figure', by: joiner.id }, causedBy: fact.seq });
    }
  }

  return { facts, state: { upToSeq: seq - 1, listeners, fired } };
}
