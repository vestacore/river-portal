import type { DocStore } from '@river/store';
import { streamPaths } from './paths.ts';
import type { Fact } from './types/Fact.ts';

/** Every fact of one stream, in order — the whole river of one key, from its source to its mouth. */
export async function readStream(store: DocStore, root: string, stream: string): Promise<Fact[]> {
  const rows = await store.query<Fact>(streamPaths.log(root, stream), { orderBy: { field: 'seq', direction: 'asc' } });
  return rows.map(({ id: _id, ...fact }) => fact as Fact);
}
