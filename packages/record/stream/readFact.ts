import type { DocStore } from '@river/store';
import { streamPaths } from './paths.ts';
import type { Fact } from './types/Fact.ts';

/** One fact by its address: the stream and the sequence number. */
export function readFact(store: DocStore, root: string, stream: string, seq: number): Promise<Fact | null> {
  return store.get<Fact>(streamPaths.fact(root, stream, seq));
}
