import type { SnippetKind } from '@river/assist';
import type { LocalisedText } from '@river/i18n';

/** A published feed item (`public/{org}/feed/{id}`). */
export type PublicFeedItem = {
  id: string;
  kind: SnippetKind;
  text: LocalisedText;
  reportId: string | null;
  campaignId: string | null;
  oblastId: string | null;
  publishedAt: string;
};
