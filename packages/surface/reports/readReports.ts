import type { DocStore } from '@river/store';
import { reportPaths } from './paths.ts';
import type { Report } from './types/Report.ts';

/** All reports, newest first (team view). */
export async function readReports(store: DocStore, orgId: string): Promise<Report[]> {
  return store.query<Report>(reportPaths.reports(orgId), { orderBy: { field: 'createdAt', direction: 'desc' }, limit: 200 });
}
