import type { LogEvent, Projector } from '@river/log';
import { giftPaths } from './paths.ts';
import type { Gift } from './types/Gift.ts';
import type { GiftPledgedPayload } from './types/GiftPledgedPayload.ts';
import type { GiftStatus } from './types/GiftStatus.ts';

const statusBy: Record<string, GiftStatus> = {
  'gift.Received': 'received',
  'gift.Allocated': 'allocated',
  'gift.Delivered': 'delivered',
};

async function project(event: LogEvent, tx: Parameters<Projector['project']>[1]): Promise<void> {
  const path = giftPaths.gift(event.orgId, event.aggregate.id);
  if (event.type === 'gift.Pledged') {
    const p = event.payload as GiftPledgedPayload;
    const gift: Gift = { id: event.aggregate.id, status: 'pledged', flowId: null, pledgedAt: event.occurredAt, updatedAt: event.occurredAt, ...p };
    tx.set(path, gift);
    return;
  }
  const gift = await tx.get<Gift>(path);
  const status = statusBy[event.type];
  if (!gift || !status) return;
  gift.status = status;
  if (typeof event.payload.flowId === 'string') gift.flowId = event.payload.flowId;
  gift.updatedAt = event.occurredAt;
  tx.set(path, gift);
}

/** Maintains the team view of each gift. */
export const giftProjector: Projector = { name: 'gifts', handles: ['gift.Pledged', ...Object.keys(statusBy)], project };
