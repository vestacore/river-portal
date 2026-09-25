import type { DocStore } from '@river/store';
import { reportPaths } from './paths.ts';
import type { PublicReport } from './types/PublicReport.ts';

/** A published report; null when it does not exist or was withdrawn. */
export async function readPublicReport(store: DocStore, orgId: string, reportId: string): Promise<PublicReport | null> {
  return store.get<PublicReport>(reportPaths.publicReport(orgId, reportId));
}
