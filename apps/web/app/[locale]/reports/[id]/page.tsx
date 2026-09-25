import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findCategory } from '@river/needs';
import { formatDate, formatMoney, oblastName, pickText, pluralise } from '@river/i18n';
import { readPublicReport } from '@river/reports';
import { getRuntime } from '@river/runtime';
import { CostBreakdown } from '@/components/site/CostBreakdown';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { resolveLocale } from '@/lib/resolveLocale';

export const revalidate = 30;
type Props = { params: Promise<{ locale: string; id: string }> };

async function load(id: string) {
  if (!/^report_[0-9A-Z]{26}$/.test(id)) return null;
  const runtime = await getRuntime();
  return readPublicReport(runtime.store, runtime.config.orgId, id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const report = await load(id);
  return report ? { title: pickText(report.title, resolveLocale(locale)) } : {};
}

/** A published report: server-rendered HTML plus public facts. */
export default async function ReportPage({ params }: Props) {
  const { locale: segment, id } = await params;
  const locale = resolveLocale(segment);
  const dict = getDictionary(locale);
  const report = await load(id);
  if (!report) notFound();
  const f = report.facts;
  const facts = [
    { icon: 'globe', label: dict.report.region, value: oblastName(f.oblastId, locale) },
    { icon: 'check', label: dict.report.delivered, value: f.arrivedAt ? formatDate(f.arrivedAt, locale) : '—' },
    { icon: 'heart', label: dict.report.reached, value: pluralise(f.recipients.length, locale, dict.report.households) },
    { icon: 'route', label: dict.report.costs, value: formatMoney(f.costsMinor, f.currency, locale) },
  ];
  return (
    <article>
      <header className="paper-grid pb-10 pt-14">
        <Container narrow>
          <div className="flex flex-wrap gap-2">
            <Badge tone="teal">{dict.report.kicker}</Badge>
            {f.categoryIds.map((c) => <Badge key={c} tone="ink">{pickText(findCategory(c)?.label, locale)}</Badge>)}
          </div>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">{pickText(report.title, locale)}</h1>
          <p className="mt-3 text-ink-500">{formatDate(report.publishedAt, locale)}</p>
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map((x) => (
              <div key={x.label} className="border-t border-graphite/60 pt-3">
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500"><Icon name={x.icon} className="size-4 text-teal-500" />{x.label}</dt>
                <dd className="mt-1 font-display text-lg font-bold text-river-900">{x.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </header>
      <Container narrow>
        <div className="prose-river text-lg" dangerouslySetInnerHTML={{ __html: report.html[locale] }} />
        {f.gratitude ? (
          <figure className="chamfer mt-10 p-8 [--cut:24px] [--fill:var(--color-sunrise-100)]">
            <p className="text-sm font-semibold uppercase tracking-wider text-sunrise-600">{dict.report.thanks}</p>
            <blockquote lang={f.gratitude.locale === 'uk' ? 'uk' : 'en-GB'} className="mt-3 font-display text-2xl font-semibold leading-snug text-river-900">“{f.gratitude.text}”</blockquote>
          </figure>
        ) : null}
        <section className="mt-10 sketch bg-paper p-7">
          <h2 className="mb-5 text-xl font-bold">{dict.report.breakdown}</h2>
          <CostBreakdown breakdown={f.costBreakdown} currency={f.currency} locale={locale} dict={dict} />
        </section>
        <p className="mt-8 flex items-start gap-2 text-sm text-ink-500"><Icon name="shield" className="mt-0.5 size-4 shrink-0" />{dict.report.pseudonymised}</p>
      </Container>
    </article>
  );
}
