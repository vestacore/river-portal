import type { DocStore } from '@river/store';
import { flowPaths } from './paths.ts';
import type { Flow } from './types/Flow.ts';

/** Flows carried by one person (the carrier's own view). */
export async function readFlowsByCarrier(store: DocStore, orgId: string, personId: string): Promise<Flow[]> {
  const rows = await store.query<Flow>(flowPaths.flows(orgId), { where: [{ field: 'carrier.personId', op: '==', value: personId }] });
  return rows.sort((a, b) => b.formedAt.localeCompare(a.formedAt));
}
