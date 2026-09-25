import type { DocStore } from '@river/store';
import type { LogEvent } from './types/LogEvent.ts';

/** Events of one aggregate in the order they occurred (audit trail in the studio). */
export async function readEvents(store: DocStore, orgId: string, aggregateId: string): Promise<LogEvent[]> {
  const rows = await store.query<LogEvent>(`orgs/${orgId}/events`, {
    where: [{ field: 'aggregate.id', op: '==', value: aggregateId }],
  });
  return rows.sort((a, b) => (a.occurredAt === b.occurredAt ? a.recordedAt.localeCompare(b.recordedAt) : a.occurredAt.localeCompare(b.occurredAt)));
}
