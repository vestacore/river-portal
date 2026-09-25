/** Firestore paths owned by the reports package. */
export const reportPaths = {
  report: (orgId: string, reportId: string) => `orgs/${orgId}/reports/${reportId}`,
  reports: (orgId: string) => `orgs/${orgId}/reports`,
  publicReport: (orgId: string, reportId: string) => `public/${orgId}/reports/${reportId}`,
};
