import type { LogEvent, Projector } from '@river/log';
import { flowPaths } from './paths.ts';
import type { CarrierKind } from './types/CarrierKind.ts';
import type { CostSubmittedPayload } from './types/CostSubmittedPayload.ts';
import type { Flow } from './types/Flow.ts';
import type { GratitudeWrittenPayload } from './types/GratitudeWrittenPayload.ts';

async function project(event: LogEvent, tx: Parameters<Projector['project']>[1]): Promise<void> {
  const p = event.payload as Record<string, unknown>;
  if (event.type === 'flow.Formed') {
    const flow: Flow = {
      id: event.aggregate.id, status: 'forming', needIds: p.needIds as string[], giftIds: p.giftIds as string[],
      campaignId: (p.campaignId as string | null) ?? null, oblastId: p.oblastId as string, lead: p.lead as string,
      carrier: null, fromLabel: null, costs: [], confirmations: [], gratitude: [], reportId: null,
      formedAt: event.occurredAt, dispatchedAt: null, arrivedAt: null, confirmedAt: null, updatedAt: event.occurredAt,
    };
    tx.set(flowPaths.flow(event.orgId, flow.id), flow);
    return;
  }
  const flowId = event.aggregate.kind === 'flow' ? event.aggregate.id : (p.flowId as string | undefined);
  if (!flowId) return;
  const path = flowPaths.flow(event.orgId, flowId);
  const flow = await tx.get<Flow>(path);
  if (!flow) return;
  switch (event.type) {
    case 'flow.Committed': flow.status = 'committed'; break;
    case 'consignment.Dispatched':
      flow.carrier = { kind: p.carrierKind as CarrierKind, name: p.carrierName as string, personId: (p.carrierPersonId as string | null) ?? null };
      flow.fromLabel = p.fromLabel as string;
      flow.dispatchedAt = event.occurredAt;
      break;
    case 'costRecord.Submitted': {
      const c = p as CostSubmittedPayload;
      flow.costs.push({ id: event.aggregate.id, kind: c.kind, amountMinor: c.amountMinor, currency: c.currency, fxRate: c.fxRate, reportingCurrency: c.reportingCurrency, reportingMinor: c.reportingMinor, note: c.note, status: 'submitted', at: event.occurredAt });
      break;
    }
    case 'costRecord.Approved': {
      const line = flow.costs.find((c) => c.id === event.aggregate.id);
      if (line) line.status = 'approved';
      break;
    }
    case 'flow.MotionStarted': flow.status = 'in_motion'; break;
    case 'flow.Arrived': flow.status = 'arrived'; flow.arrivedAt = event.occurredAt; break;
    case 'deliveryConfirmation.Recorded': flow.confirmations.push({ needId: p.needId as string, by: p.by as string, at: event.occurredAt }); break;
    case 'gratitudeNote.Written': {
      const g = p as GratitudeWrittenPayload;
      flow.gratitude.push({ noteId: event.aggregate.id, needId: g.needId, locale: g.locale, onWall: g.onWall, sharedWithParticipants: g.sharedWithParticipants });
      break;
    }
    case 'flow.Confirmed': flow.status = 'confirmed'; flow.confirmedAt = event.occurredAt; break;
    case 'flow.Reported': flow.status = 'reported'; flow.reportId = p.reportId as string; break;
    default: return;
  }
  flow.updatedAt = event.occurredAt;
  tx.set(path, flow);
}

/** Maintains the team view of each flow, including costs, confirmations and thanks. */
export const flowProjector: Projector = {
  name: 'flows',
  handles: [
    'flow.Formed', 'flow.Committed', 'consignment.Dispatched', 'costRecord.Submitted', 'costRecord.Approved', 'flow.MotionStarted',
    'flow.Arrived', 'deliveryConfirmation.Recorded', 'gratitudeNote.Written', 'flow.Confirmed', 'flow.Reported',
  ],
  project,
};
