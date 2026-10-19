import type { Doc, DocStore } from '@river/store';
import { readStream } from '@river/stream';
import { foldStream } from './foldStream.ts';
import type { Assembly } from './types/Assembly.ts';
import type { FigureState } from './types/FigureState.ts';

/**
 * Replays a stream and returns what the wave keeps beside it: the listeners' state, the joiners'
 * latches and every view. Recovery uses it; tests use it as the oracle that the caches equal a fold
 * of the truth.
 */
export async function rebuildState(store: DocStore, root: string, assembly: Assembly, stream: string): Promise<{ state: FigureState; views: Record<string, Doc | null> }> {
  return foldStream(assembly, await readStream(store, root, stream));
}
