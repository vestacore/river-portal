import { redactPii } from '@river/privacy';
import type { LogEvent, Projector } from '@river/log';
import { needPaths } from './paths.ts';
import type { NeedPrivate } from './types/NeedPrivate.ts';
import type { NeedRecord } from './types/NeedRecord.ts';
import type { NeedStatus } from './types/NeedStatus.ts';
import type { NeedSubmittedPayload } from './types/NeedSubmittedPayload.ts';
import type { TimelineCode } from './types/TimelineEntry.ts';

const transitions: Record<string, { status?: NeedStatus; code?: TimelineCode }> = {
  'need.Acknowledged': { status: 'acknowledged', code: 'acknowledged' },
  'need.Triaged': { status: 'triaged', code: 'triaged' },
  'need.Opened': { status: 'open' },
  'need.Matched': { status: 'matched', code: 'matched' },
  'need.DeliveryStarted': { status: 'in_delivery', code: 'dispatched' },
  'need.Delivered': { status: 'delivered', code: 'delivered' },
  'need.Confirmed': { status: 'confirmed', code: 'confirmed' },
  'need.Closed': { status: 'closed', code: 'closed' },
};

async function project(event: LogEvent, tx: Parameters<Projector['project']>[1]): Promise<void> {
  const path = needPaths.record(event.orgId, event.aggregate.id);
  if (event.type === 'need.Submitted') {
    const p = event.payload as NeedSubmittedPayload;
    const details = await tx.get<NeedPrivate>(needPaths.private(event.orgId, event.aggregate.id));
    const summary = details ? redactPii(details.description, [details.name, details.settlement]).slice(0, 160) : '';
    const record: NeedRecord = {
      id: event.aggregate.id,
      status: 'submitted',
      categoryId: p.categoryId,
      form: p.form,
      oblastId: p.oblastId,
      forWhom: p.forWhom,
      householdSize: p.householdSize,
      urgency: p.urgency,
      locale: p.locale,
      personId: p.personId,
      summary,
      consentToStory: p.consentToStory,
      flowId: null,
      submittedAt: event.occurredAt,
      updatedAt: event.occurredAt,
      timeline: [{ at: event.occurredAt, code: 'submitted' }],
    };
    tx.set(path, record);
    return;
  }
  const record = await tx.get<NeedRecord>(path);
  const change = transitions[event.type];
  if (!record || !change) return;
  if (change.status) record.status = change.status;
  if (change.code) record.timeline.push({ at: event.occurredAt, code: change.code });
  if (typeof event.payload.flowId === 'string') record.flowId = event.payload.flowId;
  record.updatedAt = event.occurredAt;
  tx.set(path, record);
}

/** Maintains the team view of each need. */
export const needProjector: Projector = {
  name: 'needs',
  handles: ['need.Submitted', ...Object.keys(transitions)],
  project,
};
