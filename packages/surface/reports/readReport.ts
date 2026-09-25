import type { DocStore } from '@river/store';
import { reportPaths } from './paths.ts';
import type { Report } from './types/Report.ts';

/** A report in any status (team view). */
export async function readReport(store: DocStore, orgId: string, reportId: string): Promise<Report | null> {
  return store.get<Report>(reportPaths.report(orgId, reportId));
}
