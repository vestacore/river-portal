import type { DocTransaction } from '@river/store';
import { streamPaths } from './paths.ts';
import type { Fact } from './types/Fact.ts';
import type { StreamHead } from './types/StreamHead.ts';

/**
 * Writes one fragment — the facts of one wave — and moves the head, inside the caller's transaction.
 * Facts are created, never set: a second writer that read the same head fails the whole transaction,
 * so a stream never forks. The facts must continue the head without a gap.
 */
export function commitFacts(tx: DocTransaction, root: string, head: StreamHead, facts: readonly Fact[], at: string): StreamHead {
  let expected = head.nextSeq;
  for (const fact of facts) {
    if (fact.seq !== expected) throw new Error(`Stream ${head.stream}: fact ${fact.seq} does not continue the head ${expected}`);
    tx.create(streamPaths.fact(root, head.stream, fact.seq), fact);
    expected += 1;
  }
  const next: StreamHead = { stream: head.stream, nextSeq: expected, waves: facts.length > 0 ? head.waves + 1 : head.waves, updatedAt: at };
  tx.set(streamPaths.head(root, head.stream), next);
  return next;
}
