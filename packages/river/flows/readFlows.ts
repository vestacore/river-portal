import type { DocStore } from '@river/store';
import { flowPaths } from './paths.ts';
import type { Flow } from './types/Flow.ts';

/** Flows for the studio, newest first. */
export async function readFlows(store: DocStore, orgId: string): Promise<Flow[]> {
  return store.query<Flow>(flowPaths.flows(orgId), { orderBy: { field: 'formedAt', direction: 'desc' }, limit: 200 });
}
