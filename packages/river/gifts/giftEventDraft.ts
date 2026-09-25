import type { EventDraft } from '@river/log';
import type { GiftFollowUp } from './types/GiftFollowUp.ts';

/** Builds the draft for a gift status change emitted by a flow. */
export function giftEventDraft(giftId: string, type: GiftFollowUp, payload: Record<string, unknown>): EventDraft {
  return { type, aggregate: { kind: 'gift', id: giftId }, visibility: 'team', payload };
}
