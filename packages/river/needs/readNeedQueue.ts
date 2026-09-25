import type { DocStore } from '@river/store';
import { needPaths } from './paths.ts';
import type { NeedRecord } from './types/NeedRecord.ts';

/** Needs for the coordinator queue, newest first. */
export async function readNeedQueue(store: DocStore, orgId: string, limit = 200): Promise<NeedRecord[]> {
  return store.query<NeedRecord>(needPaths.collection(orgId), { orderBy: { field: 'submittedAt', direction: 'desc' }, limit });
}
