import type { SnippetKind } from '@river/assist';
import type { LocalisedText } from '@river/i18n';
import type { LogEvent, Projector } from '@river/log';
import { feedPaths } from './paths.ts';
import type { FeedItem } from './types/FeedItem.ts';
import type { PublicFeedItem } from './types/PublicFeedItem.ts';

async function project(event: LogEvent, tx: Parameters<Projector['project']>[1]): Promise<void> {
  const p = event.payload as Record<string, unknown>;
  if (p.publicationKind !== 'feedItem') return;
  const path = feedPaths.item(event.orgId, event.aggregate.id);
  if (event.type === 'publication.Drafted') {
    const item: FeedItem = {
      id: event.aggregate.id, status: 'suggested', kind: p.kind as SnippetKind, text: p.text as LocalisedText,
      reportId: (p.reportId as string | null) ?? null, campaignId: (p.campaignId as string | null) ?? null, oblastId: (p.oblastId as string | null) ?? null,
      source: p.source as FeedItem['source'], model: (p.model as string | null) ?? null, createdAt: event.occurredAt, publishedAt: null,
    };
    tx.set(path, item);
    return;
  }
  const item = await tx.get<FeedItem>(path);
  if (!item) return;
  const publicPath = feedPaths.publicItem(event.orgId, item.id);
  if (event.type === 'publication.Published') {
    item.status = 'published';
    item.text = p.text as LocalisedText;
    item.publishedAt = event.occurredAt;
    const pub: PublicFeedItem = { id: item.id, kind: item.kind, text: item.text, reportId: item.reportId, campaignId: item.campaignId, oblastId: item.oblastId, publishedAt: event.occurredAt };
    tx.set(publicPath, pub);
  } else if (event.type === 'publication.Withdrawn') {
    item.status = 'withdrawn';
    tx.delete(publicPath);
  } else if (event.type === 'ai.SuggestionRejected') {
    item.status = 'rejected';
  } else return;
  tx.set(path, item);
}

/** Keeps feed items for the studio and their public copies. */
export const feedProjector: Projector = {
  name: 'feed',
  handles: ['publication.Drafted', 'publication.Published', 'publication.Withdrawn', 'ai.SuggestionRejected'],
  project,
};
