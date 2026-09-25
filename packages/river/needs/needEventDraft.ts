import type { EventDraft } from '@river/log';
import type { NeedFollowUp } from './types/NeedFollowUp.ts';

/** Builds the draft for a need status change emitted by another package's command. */
export function needEventDraft(needId: string, type: NeedFollowUp, payload: Record<string, unknown>): EventDraft {
  return { type, aggregate: { kind: 'need', id: needId }, visibility: 'team', payload };
}
