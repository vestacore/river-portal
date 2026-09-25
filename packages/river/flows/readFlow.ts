import type { DocStore } from '@river/store';
import { flowPaths } from './paths.ts';
import type { Flow } from './types/Flow.ts';

/** One flow (team view). */
export async function readFlow(store: DocStore, orgId: string, flowId: string): Promise<Flow | null> {
  return store.get<Flow>(flowPaths.flow(orgId, flowId));
}
