import type { RichDoc } from '@river/content';
import type { PublicFeedItem } from '@river/feed';
import { feedPaths } from '@river/feed';
import type { CampaignLaunchedPayload, Gift, GiftPledgedPayload } from '@river/gifts';
import { giftPaths } from '@river/gifts';
import type { CostSubmittedPayload, GratitudeWrittenPayload } from '@river/flows';
import type { Locale } from '@river/i18n';
import type { LogEvent, Projector } from '@river/log';
import { needPaths, type NeedRecord } from '@river/needs';
import { reportPaths, type PublicReport } from '@river/reports';
import { emptySiteDoc } from './emptySiteDoc.ts';
import { pagePaths } from './paths.ts';
import type { SiteDoc } from './types/SiteDoc.ts';

const FEED_SIZE = 12;
const LIST_SIZE = 6;

async function project(event: LogEvent, tx: Parameters<Projector['project']>[1]): Promise<void> {
  const path = pagePaths.site(event.orgId);
  const site = (await tx.get<SiteDoc>(path)) ?? emptySiteDoc(event.orgId, event.occurredAt);
  const p = event.payload as Record<string, unknown>;
  const c = site.counters;
  const campaignCard = (id: unknown) => site.campaigns.find((x) => x.id === id);

  switch (event.type) {
    case 'need.Submitted': c.needsReceived += 1; break;
    case 'need.Confirmed': {
      const need = await tx.get<NeedRecord>(needPaths.record(event.orgId, event.aggregate.id));
      c.needsConfirmed += 1;
      c.households += need?.householdSize ?? 1;
      c.lastConfirmedAt = event.occurredAt;
      break;
    }
    case 'flow.Arrived': c.deliveries += 1; break;
    case 'gift.Pledged': {
      const g = p as GiftPledgedPayload;
      c.giftsPledged += 1;
      const card = campaignCard(g.campaignId);
      if (card) { card.giftsCount += 1; if (g.currency === card.currency && g.amountMinor) card.pledgedMinor += g.amountMinor; }
      break;
    }
    case 'gift.Received': {
      const gift = await tx.get<Gift>(giftPaths.gift(event.orgId, event.aggregate.id));
      if (gift?.currency && gift.amountMinor) c.moneyReceivedMinor += gift.amountMinor;
      const card = campaignCard(gift?.campaignId);
      if (card && gift?.currency === card.currency && gift.amountMinor) card.receivedMinor += gift.amountMinor;
      break;
    }
    case 'costRecord.Approved': {
      const cost = p as CostSubmittedPayload;
      c.costsMinor += cost.reportingMinor;
      c.costBreakdown = { ...c.costBreakdown, [cost.kind]: (c.costBreakdown?.[cost.kind] ?? 0) + cost.reportingMinor };
      const card = campaignCard(cost.campaignId);
      if (card) card.spentMinor += cost.reportingMinor;
      break;
    }
    case 'gratitudeNote.Written': {
      const g = p as GratitudeWrittenPayload;
      c.gratitudeNotes += 1;
      if (g.onWall && g.publicText) {
        site.gratitude = [{ id: event.aggregate.id, text: g.publicText, locale: g.locale, oblastId: g.oblastId, at: event.occurredAt }, ...site.gratitude].slice(0, LIST_SIZE);
      }
      break;
    }
    case 'campaign.Launched': {
      const l = p as CampaignLaunchedPayload;
      site.campaigns.unshift({ id: event.aggregate.id, slug: l.slug, title: l.title, summary: l.summary, goalMinor: l.goalMinor, currency: l.currency, pledgedMinor: 0, receivedMinor: 0, spentMinor: 0, giftsCount: 0, status: 'active' });
      break;
    }
    case 'content.BlockEdited': {
      const b = p as { blockId: string; locale: Locale; doc: RichDoc; html: string };
      site.blocks[b.blockId] = { ...site.blocks[b.blockId], [b.locale]: { doc: b.doc, html: b.html } };
      break;
    }
    case 'publication.Published':
    case 'publication.Withdrawn': {
      const id = event.aggregate.id;
      if (p.publicationKind === 'feedItem') {
        site.feed = site.feed.filter((f) => f.id !== id);
        if (event.type === 'publication.Published') {
          const item = await tx.get<PublicFeedItem>(feedPaths.publicItem(event.orgId, id));
          if (item) site.feed = [item, ...site.feed].slice(0, FEED_SIZE);
        }
      } else if (p.publicationKind === 'report') {
        site.reports = site.reports.filter((r) => r.id !== id);
        if (event.type === 'publication.Published') {
          const report = await tx.get<PublicReport>(reportPaths.publicReport(event.orgId, id));
          if (report) site.reports = [{ id, title: report.title, oblastId: report.facts.oblastId, campaignId: report.campaignId, publishedAt: report.publishedAt }, ...site.reports].slice(0, LIST_SIZE);
        }
      }
      break;
    }
    default: return;
  }
  site.updatedAt = event.occurredAt;
  tx.set(path, site);
}

/**
 * Builds the site document. Iteration 1 updates counters immediately; the 72-hour delay for public
 * aggregates is a recorded deviation (meta: Nearest-Variant Assumptions). Must run after the
 * reports and feed projectors, whose public documents it reads.
 */
export const sitePageProjector: Projector = {
  name: 'site-page',
  handles: [
    'need.Submitted', 'need.Confirmed', 'flow.Arrived', 'gift.Pledged', 'gift.Received', 'costRecord.Approved',
    'gratitudeNote.Written', 'campaign.Launched', 'content.BlockEdited', 'publication.Published', 'publication.Withdrawn',
  ],
  project,
};
