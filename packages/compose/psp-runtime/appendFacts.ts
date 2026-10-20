import { factDefinition, type PspDraft, type PspFact } from '@river/psp-facts';
import type { Origin } from '@river/stream';
import { boundaryOfStream } from './boundaryOfStream.ts';
import { projectFact } from './projectFact.ts';
import { releaseWebhooks } from './releaseWebhooks.ts';
import type { World } from './types/World.ts';

/**
 * The one writer of the PSP. It appends one wave of drafts to one stream — numbered densely, each caused
 * by the one before it — and refuses a draft whose type another boundary owns: an order stream holds only
 * order facts, a session stream only bridges. Then every projection that hears each fact forms itself, the
 * ledger posts what the fact means for the money, and released facts go out as webhooks.
 */
export function appendFacts(world: World, stream: string, drafts: readonly PspDraft[], origin: Origin, at: string, causedBy: number | null = null): PspFact[] {
  const boundary = boundaryOfStream(stream);
  for (const draft of drafts) {
    const owner = factDefinition(draft.type).owner;
    if (owner !== boundary) throw new Error(`${draft.type} belongs to the ${owner} boundary and cannot be written into ${stream}`);
  }
  const facts = world.streams.get(stream) ?? [];
  const wave = facts.length > 0 ? facts[facts.length - 1]!.wave + 1 : 0;
  const written: PspFact[] = [];
  for (const draft of drafts) {
    const fact = { stream, seq: facts.length, type: draft.type, payload: draft.payload, origin, wave, causedBy: written.length > 0 ? written[written.length - 1]!.seq : causedBy, at } as PspFact;
    facts.push(fact);
    world.log.push(fact);
    written.push(fact);
    projectFact(world, fact);
    releaseWebhooks(world, fact);
  }
  world.streams.set(stream, facts);
  world.version += 1;
  return written;
}
