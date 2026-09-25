import type { DocStore } from '@river/store';
import { flowPaths } from './paths.ts';
import { readFlow } from './readFlow.ts';
import type { GratitudeNote } from './types/GratitudeNote.ts';

/**
 * Thanks the recipients of a flow chose to share with the people who helped, without names or
 * places (the participants' view: givers, sponsors and the carrier).
 */
export async function readSharedThanks(store: DocStore, orgId: string, flowId: string): Promise<Array<{ text: string; locale: string; writtenAt: string }>> {
  const flow = await readFlow(store, orgId, flowId);
  if (!flow) return [];
  const notes = await Promise.all(flow.gratitude.filter((g) => g.sharedWithParticipants).map((g) => store.get<GratitudeNote>(flowPaths.gratitude(orgId, g.noteId))));
  return notes.flatMap((n) => (n?.sharedText ? [{ text: n.sharedText, locale: n.locale, writtenAt: n.writtenAt }] : []));
}
