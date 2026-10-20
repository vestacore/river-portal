import { factDefinition, type PspFact } from '@river/psp-facts';
import type { BridgeRow, ProjectionDelta } from './types/Views.ts';

/** The river of one session: its bridges in order, each with what it formed in the four views and the ledger. */
export function riverOf(facts: readonly PspFact[], deltas: ReadonlyMap<string, readonly ProjectionDelta[]>): BridgeRow[] {
  return facts.map((fact) => {
    const definition = factDefinition(fact.type);
    return { seq: fact.seq, wave: fact.wave, type: fact.type, stage: definition.stage, speaker: definition.speaker, origin: fact.origin, causedBy: fact.causedBy, at: fact.at, payload: fact.payload, formed: [...(deltas.get(`${fact.stream}#${fact.seq}`) ?? [])] };
  });
}
