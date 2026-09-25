import type { SnippetKind } from '@river/assist';
import type { LocalisedText } from '@river/i18n';
import type { FeedItemStatus } from './FeedItemStatus.ts';

/** A feed item in the studio (`orgs/{org}/feed/{id}`, `team` until published). */
export type FeedItem = {
  id: string;
  status: FeedItemStatus;
  kind: SnippetKind;
  text: LocalisedText;
  reportId: string | null;
  campaignId: string | null;
  oblastId: string | null;
  source: 'vertex' | 'fallback' | 'editor';
  model: string | null;
  createdAt: string;
  publishedAt: string | null;
};
