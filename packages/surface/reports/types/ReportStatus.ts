export const reportStatuses = ['draft', 'published', 'withdrawn'] as const;
export type ReportStatus = (typeof reportStatuses)[number];
