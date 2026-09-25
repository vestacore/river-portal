import { newId, nowIso } from '@river/kernel';
import type { DocTransaction } from '@river/store';
import { eventPath } from './eventPath.ts';
import type { CommandEnv } from './types/CommandEnv.ts';
import type { EventDraft } from './types/EventDraft.ts';
import type { LogEvent } from './types/LogEvent.ts';

/**
 * Appends events to the log and runs the projectors in one transaction (ADR-0011).
 * `privateWrites` stores personal data outside the log, in the same transaction.
 * Returns the committed events.
 */
export async function commit(
  env: CommandEnv,
  drafts: readonly EventDraft[],
  privateWrites?: (tx: DocTransaction) => void | Promise<void>,
): Promise<LogEvent[]> {
  const recordedAt = nowIso();
  const correlationId = env.ctx.correlationId ?? newId('cor');
  const events: LogEvent[] = [];
  for (const draft of drafts) {
    const occurredAt = draft.occurredAt ?? env.ctx.at ?? recordedAt;
    events.push({
      id: newId('evt', new Date(occurredAt)),
      type: draft.type,
      aggregate: draft.aggregate,
      orgId: env.ctx.orgId,
      actor: env.ctx.actor,
      occurredAt,
      recordedAt,
      payload: draft.payload,
      visibility: draft.visibility,
      correlationId,
      causationId: events[0]?.id ?? null,
      schemaVersion: 1,
    });
  }

  await env.store.transact(async (tx) => {
    for (const event of events) tx.create(eventPath(event.orgId, event.id), event);
    if (privateWrites) await privateWrites(tx);
    for (const event of events) {
      for (const projector of env.projectors) {
        if (projector.handles.includes(event.type) || projector.handles.includes('*')) {
          await projector.project(event, tx);
        }
      }
    }
  });
  return events;
}
