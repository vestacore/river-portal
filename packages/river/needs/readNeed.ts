import type { DocStore } from '@river/store';
import { needPaths } from './paths.ts';
import type { NeedPrivate } from './types/NeedPrivate.ts';
import type { NeedRecord } from './types/NeedRecord.ts';

/** A need with its private details, for assigned staff only. */
export async function readNeed(
  store: DocStore,
  orgId: string,
  needId: string,
): Promise<{ record: NeedRecord; details: NeedPrivate | null } | null> {
  const [record, details] = await Promise.all([
    store.get<NeedRecord>(needPaths.record(orgId, needId)),
    store.get<NeedPrivate>(needPaths.private(orgId, needId)),
  ]);
  return record ? { record, details } : null;
}
