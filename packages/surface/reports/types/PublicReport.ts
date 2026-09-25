import type { Locale, LocalisedText } from '@river/i18n';
import type { ReportFacts } from './ReportFacts.ts';

/** The published report (`public/{org}/reports/{id}`): HTML per locale plus public facts only. */
export type PublicReport = {
  id: string;
  campaignId: string | null;
  title: LocalisedText;
  html: Record<Locale, string>;
  facts: Omit<ReportFacts, 'flowId' | 'fromLabel'>;
  publishedAt: string;
};
