import type { DocStore } from '@river/store';
import { figurePaths } from './paths.ts';
import type { Assembly } from './types/Assembly.ts';
import type { OutboxEntry } from './types/OutboxEntry.ts';

/** The intentions still waiting for the controllers of an assembly, oldest first. */
export async function readOutbox(store: DocStore, root: string, assembly: Assembly): Promise<OutboxEntry[]> {
  const all: OutboxEntry[] = [];
  for (const controller of assembly.controllers) {
    const rows = await store.query<OutboxEntry>(figurePaths.outbox(root, controller.id), { where: [{ field: 'status', op: '==', value: 'pending' }] });
    all.push(...rows.map(({ id: _id, ...entry }) => entry as OutboxEntry));
  }
  return all.sort((a, b) => (a.at === b.at ? a.seq - b.seq : a.at.localeCompare(b.at)));
}
