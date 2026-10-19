import type { Fact } from '@river/stream';
import { intentionTypes } from './data/intentionTypes.ts';
import type { RiverRow } from './types/RiverRow.ts';

/**
 * A stream as rows to read: who gave each fact, what it follows from, and what kind of step it is.
 * The pay key's hash is shortened to a fingerprint; nothing else is hidden — the stream holds no
 * personal or card data to hide.
 */
export function riverOf(facts: readonly Fact[]): RiverRow[] {
  return facts.map((fact) => {
    const { origin } = fact;
    const payload = { ...fact.payload };
    if (typeof payload.payKeyHash === 'string') payload.payKeyHash = `${payload.payKeyHash.slice(0, 8)}…`;
    const kind: RiverRow['kind'] = origin.via === 'door' ? 'gesture'
      : origin.via === 'world' ? (origin.answering === null ? 'report' : 'answer')
      : intentionTypes.includes(fact.type) ? 'intention' : 'figure';
    const who = origin.via === 'door' ? `${origin.role} ${origin.actor}` : origin.via === 'world' ? origin.controller : origin.by;
    return { seq: fact.seq, wave: fact.wave, at: fact.at, type: fact.type, kind, who, causedBy: fact.causedBy, answering: origin.via === 'world' ? origin.answering : null, payload };
  });
}
