import type { DocStore } from '@river/store';
import { flowPaths } from './paths.ts';
import type { GratitudeNote } from './types/GratitudeNote.ts';

/** A gratitude note with its full text (private; staff only). */
export async function readGratitudeNote(store: DocStore, orgId: string, noteId: string): Promise<GratitudeNote | null> {
  return store.get<GratitudeNote>(flowPaths.gratitude(orgId, noteId));
}
