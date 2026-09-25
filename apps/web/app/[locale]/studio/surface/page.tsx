import Link from 'next/link';
import { readFlows } from '@river/flows';
import { formatDate, oblastName, pickText, segmentForLocale } from '@river/i18n';
import { hasRole } from '@river/identity';
import { readReports } from '@river/reports';
import { getRuntime } from '@river/runtime';
import { Badge } from '@/components/ui/Badge';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { requireStage } from '@/lib/requireStage';
import { resolveLocale } from '@/lib/resolveLocale';
import { draftReportAction } from '../actions';

/** Reports: deliveries ready for a report, private drafts, and published reports. */
export default async function SurfaceReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const { identity } = await requireStage('surface', locale);
  const t = getDictionary(locale).studio;
  const runtime = await getRuntime();
  const [reports, flows] = await Promise.all([readReports(runtime.store, runtime.config.orgId), readFlows(runtime.store, runtime.config.orgId)]);
  const reported = new Set(reports.map((r) => r.flowId));
  const ready = flows.filter((f) => (f.status === 'arrived' || f.status === 'confirmed') && !f.reportId && !reported.has(f.id));
  const canDraft = hasRole(identity, 'coordinator', 'editor', 'administrator');
  return (
    <div className="space-y-12">
      {ready.length > 0 ? (
        <section>
          <h2 className="annot mb-3 text-ink-500">{t.ready}</h2>
          <ul className="grid gap-3">
            {ready.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 border-t border-graphite/50 pt-3">
                <b>{f.fromLabel ?? '—'} → {oblastName(f.oblastId, locale)}</b>
                <span className="annot text-ink-500">{f.confirmedAt ? formatDate(f.confirmedAt, locale) : f.arrivedAt ? formatDate(f.arrivedAt, locale) : ''}</span>
                {canDraft ? (
                  <form action={draftReportAction} className="ml-auto"><input type="hidden" name="flowId" value={f.id} /><input type="hidden" name="localeSegment" value={segmentForLocale(locale)} />
                    <button className="chamfer px-4 py-2 text-sm font-semibold text-paper [--cut:6px] [--fill:var(--color-ink-900)] hover:[--fill:var(--color-river-800)]">{t.generateReport}</button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section>
        <h2 className="annot mb-3 text-ink-500">{t.reports}</h2>
        {reports.length === 0 ? <p className="text-ink-500">{getDictionary(locale).common.none}</p> : (
          <ul className="grid gap-3">
            {reports.map((r) => (
              <li key={r.id}>
                <Link href={href(locale, `/studio/surface/reports/${r.id}`)} className="flex flex-wrap items-center gap-3 border-t border-graphite/50 pt-3 hover:bg-paper-deep/60">
                  <b className="text-ink-900">{pickText(r.title, locale)}</b>
                  <Badge tone={r.status === 'published' ? 'teal' : r.status === 'draft' ? 'sunrise' : 'ink'}>{t.reportStatus[r.status]}</Badge>
                  <span className="ml-auto text-sm text-ink-500">{oblastName(r.facts.oblastId, locale)} · {formatDate(r.createdAt, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
