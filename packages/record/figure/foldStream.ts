import type { Doc } from '@river/store';
import type { Fact } from '@river/stream';
import type { Assembly } from './types/Assembly.ts';
import type { FigureState } from './types/FigureState.ts';

/**
 * Folds the facts of one stream, from the first, into what the wave keeps beside it: the listeners'
 * state, the joiners' latches and every view. Pure, and nothing is emitted — what the joiners
 * emitted is already among the facts.
 */
export function foldStream(assembly: Assembly, facts: readonly Fact[]): { state: FigureState; views: Record<string, Doc | null> } {
  const byId = new Map(assembly.listeners.map((listener) => [listener.id, listener]));
  const listeners: Record<string, Doc> = {};
  const fired: Record<string, number> = {};
  const views: Record<string, Doc | null> = Object.fromEntries(assembly.readings.map((reading) => [reading.id, null]));

  for (const fact of facts) {
    for (const listener of assembly.listeners) {
      if (listener.hears.includes(fact.type)) listeners[listener.id] = listener.step(listeners[listener.id] ?? listener.init, fact);
    }
    for (const joiner of assembly.joiners) {
      const scope: Record<string, Doc> = {};
      let ready = true;
      for (const [name, listenerId] of Object.entries(joiner.demands)) {
        const listener = byId.get(listenerId);
        const current = listener ? listeners[listenerId] ?? listener.init : null;
        if (!listener || !current || !listener.ready(current)) { ready = false; break; }
        scope[name] = current;
      }
      if (!ready) continue;
      const key = `${joiner.id}:${joiner.round ? joiner.round(scope) : 'once'}`;
      if (!(key in fired)) fired[key] = fact.seq;
    }
    for (const reading of assembly.readings) {
      if (reading.hears.includes(fact.type)) views[reading.id] = reading.project(views[reading.id] ?? null, fact);
    }
  }
  return { state: { upToSeq: facts.length - 1, listeners, fired }, views };
}
