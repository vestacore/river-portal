import type { DocStore } from '@river/store';
import { needPaths } from './paths.ts';
import type { NeedRecord } from './types/NeedRecord.ts';

/** The requests of one signed-in person ("my requests"), newest first. */
export async function readNeedsByPerson(store: DocStore, orgId: string, personId: string): Promise<NeedRecord[]> {
  const rows = await store.query<NeedRecord>(needPaths.collection(orgId), { where: [{ field: 'personId', op: '==', value: personId }] });
  return rows.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}
