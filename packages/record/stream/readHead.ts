import type { DocTransaction } from '@river/store';
import { streamPaths } from './paths.ts';
import type { StreamHead } from './types/StreamHead.ts';

/** The head of a stream inside a transaction; a stream that does not exist yet starts at 0. */
export async function readHead(tx: DocTransaction, root: string, stream: string): Promise<StreamHead> {
  const found = await tx.get<StreamHead>(streamPaths.head(root, stream));
  return found ?? { stream, nextSeq: 0, waves: 0, updatedAt: null };
}
