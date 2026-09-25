import type { Locale, LocalisedText } from '@river/i18n';
import type { RichText } from '@river/content';
import type { ReportFacts } from './ReportFacts.ts';
import type { ReportStatus } from './ReportStatus.ts';

/** A report on a flow (`orgs/{org}/reports/{id}`); private (`team`) until published. */
export type Report = {
  id: string;
  flowId: string;
  campaignId: string | null;
  status: ReportStatus;
  title: LocalisedText;
  body: Record<Locale, RichText>;
  facts: ReportFacts;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  safetyOverride: boolean;
};
