import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatMoney, oblastName, pickText, segmentForLocale } from '@river/i18n';
import { hasRole } from '@river/identity';
import { readReport, safetyDelayDays } from '@river/reports';
import { getRuntime } from '@river/runtime';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { loadSettings } from '@/lib/loadSettings';
import { requireStage } from '@/lib/requireStage';
import { resolveLocale } from '@/lib/resolveLocale';
import { suggestFeedAction, withdrawReportAction } from '../../../actions';
import { PublishPanel } from './PublishPanel';
import { ReportEditor } from './ReportEditor';

/** A report in the studio: private until published; edit it, publish it, compose feed items with AI. */
export default async function StudioReportPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: segment, id } = await params;
  const locale = resolveLocale(segment);
  const { identity } = await requireStage('surface', locale);
  const canEdit = hasRole(identity, 'editor', 'administrator');
  const dict = getDictionary(locale);
  const t = dict.studio;
  const [runtime, settings] = await Promise.all([getRuntime(), loadSettings()]);
  const report = await readReport(runtime.store, runtime.config.orgId, id);
  if (!report) notFound();
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold">{t.editReport}</h2>
          <Badge tone={report.status === 'published' ? 'teal' : 'sunrise'}>{t.reportStatus[report.status]}</Badge>
          {report.status === 'published' ? <Link className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-river-700 underline" href={href(locale, `/reports/${report.id}`)}>{dict.common.public}<Icon name="external" className="size-4" /></Link> : null}
        </div>
        {canEdit ? <ReportEditor
          reportId={report.id}
          labels={dict.edit}
          titleLabel={t.titleLabel}
          saveLabel={t.saveReport}
          versions={[
            { segment: 'en-gb', label: 'English (UK)', title: report.title['en-GB'], doc: report.body['en-GB'].doc },
            { segment: 'uk', label: 'Українська', title: report.title.uk, doc: report.body.uk.doc },
          ]}
        /> : (
          <article className="sketch bg-paper p-6">
            <h3 className="text-2xl font-semibold">{pickText(report.title, locale)}</h3>
            <div className="prose-river mt-4" dangerouslySetInnerHTML={{ __html: report.body[locale].html }} />
          </article>
        )}
      </div>
      <div className="space-y-6">
        <Card>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-ink-500">{dict.report.region}</dt><dd className="font-semibold">{oblastName(report.facts.oblastId, locale)}</dd></div>
            <div><dt className="text-ink-500">{dict.report.costs}</dt><dd className="font-semibold">{formatMoney(report.facts.costsMinor, report.facts.currency, locale)}</dd></div>
            <div><dt className="text-ink-500">{dict.report.gifts}</dt><dd className="font-semibold">{report.facts.giftsCount}</dd></div>
            <div><dt className="text-ink-500">{dict.report.thanks}</dt><dd className="font-semibold">{report.facts.gratitude ? '✓' : '—'}</dd></div>
          </dl>
          <p className="mt-4 flex gap-2 text-xs text-ink-500"><Icon name="shield" className="size-4 shrink-0" />{dict.report.pseudonymised}</p>
        </Card>
        {canEdit ? <>
        <Card>
          {report.status === 'published' ? (
            <form action={withdrawReportAction}><input type="hidden" name="reportId" value={report.id} /><button className="w-full border border-attention-500/40 px-5 py-3 font-bold text-attention-500 hover:bg-attention-100">{t.withdraw}</button></form>
          ) : <PublishPanel reportId={report.id} t={{ ...t, safetyText: t.safetyText.replace('{min}', String(safetyDelayDays(settings))) }} />}
        </Card>
        <Card className="bg-teal-100/50">
          <h3 className="flex items-center gap-2 font-bold"><Icon name="sparkle" className="size-5 text-teal-600" />{t.suggest}</h3>
          <p className="mt-1 text-sm text-ink-500">{t.suggestNote}</p>
          <form action={suggestFeedAction} className="mt-4">
            <input type="hidden" name="reportId" value={report.id} />
            <input type="hidden" name="localeSegment" value={segmentForLocale(locale)} />
            <button className="chamfer w-full px-5 py-3 font-bold text-paper [--fill:var(--color-ink-900)] hover:[--fill:var(--color-river-800)]">{t.suggest}</button>
          </form>
        </Card>
        </> : null}
      </div>
    </div>
  );
}
