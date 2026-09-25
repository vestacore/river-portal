import type { CampaignLaunchedPayload, Gift, GiftPledgedPayload } from '@river/gifts';
import { giftPaths } from '@river/gifts';
import type { CostSubmittedPayload } from '@river/flows';
import type { LogEvent, Projector } from '@river/log';
import { reportPaths, type PublicReport } from '@river/reports';
import { pagePaths } from './paths.ts';
import type { CampaignPage } from './types/CampaignPage.ts';
import type { SiteDoc } from './types/SiteDoc.ts';

async function campaignIdOf(event: LogEvent, tx: Parameters<Projector['project']>[1]): Promise<string | null> {
  const p = event.payload as Record<string, unknown>;
  if (event.type === 'campaign.Launched') return event.aggregate.id;
  if (event.type === 'gift.Received') return (await tx.get<Gift>(giftPaths.gift(event.orgId, event.aggregate.id)))?.campaignId ?? null;
  if (event.type === 'publication.Published' || event.type === 'publication.Withdrawn') {
    if (p.publicationKind !== 'report') return null;
    const report = await tx.get<{ campaignId: string | null }>(reportPaths.report(event.orgId, event.aggregate.id));
    return report?.campaignId ?? null;
  }
  return (p.campaignId as string | null | undefined) ?? null;
}

async function project(event: LogEvent, tx: Parameters<Projector['project']>[1]): Promise<void> {
  const campaignId = await campaignIdOf(event, tx);
  if (!campaignId) return;
  const p = event.payload as Record<string, unknown>;
  if (event.type === 'campaign.Launched') {
    const l = p as CampaignLaunchedPayload;
    const page: CampaignPage = {
      id: campaignId, slug: l.slug, title: l.title, summary: l.summary, goalMinor: l.goalMinor, currency: l.currency,
      pledgedMinor: 0, receivedMinor: 0, spentGbpMinor: 0, giftsCount: 0, status: 'active', costBreakdown: {}, deliveries: 0,
      reports: [], launchedAt: event.occurredAt, updatedAt: event.occurredAt,
    };
    tx.set(pagePaths.campaign(event.orgId, l.slug), page);
    return;
  }
  const site = await tx.get<SiteDoc>(pagePaths.site(event.orgId));
  const slug = site?.campaigns.find((c) => c.id === campaignId)?.slug;
  if (!slug) return;
  const path = pagePaths.campaign(event.orgId, slug);
  const page = await tx.get<CampaignPage>(path);
  if (!page) return;
  switch (event.type) {
    case 'gift.Pledged': {
      const g = p as GiftPledgedPayload;
      page.giftsCount += 1;
      if (g.currency === page.currency && g.amountMinor) page.pledgedMinor += g.amountMinor;
      break;
    }
    case 'gift.Received': {
      const gift = await tx.get<Gift>(giftPaths.gift(event.orgId, event.aggregate.id));
      if (gift?.currency === page.currency && gift.amountMinor) page.receivedMinor += gift.amountMinor;
      break;
    }
    case 'costRecord.Approved': {
      const cost = p as CostSubmittedPayload;
      page.spentGbpMinor += cost.gbpMinor;
      page.costBreakdown[cost.kind] = (page.costBreakdown[cost.kind] ?? 0) + cost.gbpMinor;
      break;
    }
    case 'flow.Arrived': page.deliveries += 1; break;
    case 'publication.Published':
    case 'publication.Withdrawn': {
      page.reports = page.reports.filter((r) => r.id !== event.aggregate.id);
      if (event.type === 'publication.Published') {
        const report = await tx.get<PublicReport>(reportPaths.publicReport(event.orgId, event.aggregate.id));
        if (report) page.reports.unshift({ id: report.id, title: report.title, oblastId: report.facts.oblastId, campaignId, publishedAt: report.publishedAt });
      }
      break;
    }
    default: return;
  }
  page.updatedAt = event.occurredAt;
  tx.set(path, page);
}

/** Builds public campaign pages with honest cost breakdowns. Runs after the site projector. */
export const campaignPageProjector: Projector = {
  name: 'campaign-page',
  handles: ['campaign.Launched', 'gift.Pledged', 'gift.Received', 'costRecord.Approved', 'flow.Arrived', 'publication.Published', 'publication.Withdrawn'],
  project,
};
