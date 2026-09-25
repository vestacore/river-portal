import type { LocalisedText } from '@river/i18n';

export type ReportCard = { id: string; title: LocalisedText; oblastId: string; campaignId: string | null; publishedAt: string };
