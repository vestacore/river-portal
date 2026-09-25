import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { formatMoney, pickText } from '@river/i18n';
import { readCampaignPage } from '@river/pages';
import { getRuntime } from '@river/runtime';
import { CostBreakdown } from '@/components/site/CostBreakdown';
import { ReportCard } from '@/components/site/ReportCard';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { resolveLocale } from '@/lib/resolveLocale';

export const revalidate = 30;
type Props = { params: Promise<{ locale: string; slug: string }> };

async function load(slug: string) {
  const runtime = await getRuntime();
  return readCampaignPage(runtime.store, runtime.config.orgId, slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await load(slug);
  return page ? { title: pickText(page.title, resolveLocale(locale)) } : {};
}

/** A campaign: purpose, progress and every cost, from one page document. */
export default async function CampaignPage({ params }: Props) {
  const { locale: segment, slug } = await params;
  const locale = resolveLocale(segment);
  const dict = getDictionary(locale);
  const page = await load(slug);
  if (!page) notFound();
  const money = (n: number) => formatMoney(n, page.currency, locale);
  const stats = [
    { value: money(page.receivedMinor), label: dict.campaign.raised },
    { value: money(page.pledgedMinor), label: dict.campaign.pledged },
    { value: money(page.spentMinor), label: dict.campaign.spent },
    { value: String(page.deliveries), label: dict.campaign.deliveries },
  ];
  return (
    <>
      <section className="paper-grid border-b border-graphite/15 pb-16 pt-12 sm:pt-16">
        <Container>
          <p className="annot mb-6 flex items-center gap-2 text-ink-500">
            <span className={`size-1.5 ${page.status === 'active' ? 'bg-teal-500' : 'bg-ink-300'}`} aria-hidden="true" />
            {dict.campaign.label} · {dict.campaign[page.status]}
            <span className="h-px w-12 bg-graphite/40" aria-hidden="true" />
          </p>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.025em] sm:text-5xl">{pickText(page.title, locale)}</h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-700">{pickText(page.summary, locale)}</p>
          <div className="mt-10 max-w-2xl">
            <div className="mb-1 flex items-baseline justify-between gap-4">
              <span className="font-display text-4xl font-semibold tabular-nums text-ink-900">{money(page.receivedMinor)}</span>
              <span className="annot text-ink-500">{dict.campaign.goal} {money(page.goalMinor)}</span>
            </div>
            <ProgressBar value={page.receivedMinor} pending={page.pledgedMinor} goal={page.goalMinor} label={pickText(page.title, locale)} />
          </div>
          <div className="mt-10"><Button href={href(locale, `/give?campaign=${page.id}`)} size="lg"><Icon name="heart" />{dict.campaign.give}</Button></div>
        </Container>
      </section>
      <Container className="pt-14">
        <dl className="chamfer grid grid-cols-2 gap-x-8 gap-y-10 px-6 py-10 [--cut:32px] [--fill:var(--color-paper-deep)] sm:px-10 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col">
              <dd className="order-1 text-center font-display text-3xl font-semibold tabular-nums text-ink-900">{s.value}</dd>
              <div className="dim order-2 mt-2" aria-hidden="true" />
              <dt className="annot order-3 mt-3 text-center text-ink-500">{s.label}</dt>
            </div>
          ))}
        </dl>
        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          <section className="sketch p-7 sm:p-8">
            <h2 className="text-2xl font-semibold">{dict.campaign.costsTitle}</h2>
            <p className="mb-7 mt-2 text-ink-500">{dict.campaign.costsLead}</p>
            <CostBreakdown breakdown={page.costBreakdown} currency={page.currency} locale={locale} dict={dict} />
          </section>
          <section>
            <h2 className="mb-5 text-2xl font-semibold">{dict.campaign.reports}</h2>
            {page.reports.length === 0 ? <p className="text-ink-500">{dict.common.none}</p> : <div>{page.reports.map((r) => <ReportCard key={r.id} report={r} locale={locale} dict={dict} />)}</div>}
          </section>
        </div>
      </Container>
    </>
  );
}
