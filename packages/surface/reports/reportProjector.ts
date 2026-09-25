import type { RichDoc } from '@river/content';
import type { Locale } from '@river/i18n';
import type { LogEvent, Projector } from '@river/log';
import { reportPaths } from './paths.ts';
import type { PublicReport } from './types/PublicReport.ts';
import type { Report } from './types/Report.ts';

async function project(event: LogEvent, tx: Parameters<Projector['project']>[1]): Promise<void> {
  const p = event.payload as Record<string, unknown>;
  if (event.type.startsWith('publication.') && p.publicationKind !== 'report') return;
  const path = reportPaths.report(event.orgId, event.aggregate.id);
  if (event.type === 'report.Generated') {
    const report: Report = {
      id: event.aggregate.id, flowId: p.flowId as string, campaignId: (p.campaignId as string | null) ?? null, status: 'draft',
      title: p.title as Report['title'], body: p.body as Report['body'], facts: p.facts as Report['facts'],
      createdAt: event.occurredAt, updatedAt: event.occurredAt, publishedAt: null, safetyOverride: false,
    };
    tx.set(path, report);
    return;
  }
  const report = await tx.get<Report>(path);
  if (!report) return;
  if (event.type === 'report.Revised') {
    const locale = p.locale as Locale;
    report.title[locale] = p.title as string;
    report.body[locale] = { doc: p.doc as RichDoc, html: p.html as string };
  } else if (event.type === 'publication.Published') {
    report.status = 'published';
    report.publishedAt = event.occurredAt;
    report.safetyOverride = p.safetyOverride === true;
  } else if (event.type === 'publication.Withdrawn') {
    report.status = 'withdrawn';
  } else return;
  report.updatedAt = event.occurredAt;
  tx.set(path, report);

  const publicPath = reportPaths.publicReport(event.orgId, report.id);
  if (report.status === 'published') {
    const { flowId: _flow, fromLabel: _from, ...facts } = report.facts;
    const pub: PublicReport = {
      id: report.id, campaignId: report.campaignId, title: report.title,
      html: { 'en-GB': report.body['en-GB'].html, uk: report.body.uk.html }, facts, publishedAt: report.publishedAt ?? event.occurredAt,
    };
    tx.set(publicPath, pub);
  } else if (report.status === 'withdrawn') {
    tx.delete(publicPath);
  }
}

/** Keeps private reports and their public copies; a revision to a published report republishes it. */
export const reportProjector: Projector = {
  name: 'reports',
  handles: ['report.Generated', 'report.Revised', 'publication.Published', 'publication.Withdrawn'],
  project,
};
