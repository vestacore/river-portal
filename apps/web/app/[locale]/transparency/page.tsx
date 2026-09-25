import type { Metadata } from 'next';
import Link from 'next/link';
import { formatMoney, formatNumber, intlTag, pickText } from '@river/i18n';
import { settingText } from '@river/settings';
import { CostBreakdown } from '@/components/site/CostBreakdown';
import { PageHead } from '@/components/site/PageHead';
import { Container } from '@/components/ui/Container';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { loadSettings } from '@/lib/loadSettings';
import { loadSite } from '@/lib/loadSite';
import { resolveLocale } from '@/lib/resolveLocale';

type Props = { params: Promise<{ locale: string }> };

export const revalidate = 30;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(resolveLocale((await params).locale)).transparency.title };
}

/** The open ledger: totals, costs by kind and by campaign, all projected from the event log. */
export default async function TransparencyPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const t = dict.transparency;
  const [site, settings] = await Promise.all([loadSite(), loadSettings()]);
  const c = site.counters;
  const currency = settingText(settings, 'money.reportingCurrency');
  const money = (minor: number, cur = currency) => formatMoney(minor, cur, locale);
  const share = c.moneyReceivedMinor > 0 ? new Intl.NumberFormat(intlTag(locale), { style: 'percent', maximumFractionDigits: 1 }).format(c.costsMinor / c.moneyReceivedMinor) : '—';
  const figures: Array<[string, string]> = [
    [t.received, money(c.moneyReceivedMinor)],
    [t.costs, money(c.costsMinor)],
    [t.share, share],
    [dict.home.counters.deliveries, formatNumber(c.needsConfirmed, locale)],
  ];
  return (
    <>
      <PageHead sheet={`${dict.common.sheet} 03`} title={t.title} lead={t.lead} />
      <Container className="py-16">
        <dl className="grid border-l border-t border-graphite/30 sm:grid-cols-2 lg:grid-cols-4">
          {figures.map(([label, value]) => (
            <div key={label} className="border-b border-r border-graphite/30 p-6">
              <dt className="annot text-ink-500">{label}</dt>
              <dd className="mt-3 font-display text-3xl font-semibold tabular-nums text-ink-900">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-20 grid gap-16 lg:grid-cols-[1fr_1.3fr]">
          <section>
            <h2 className="mb-6 text-2xl font-semibold">{t.breakdown}</h2>
            <CostBreakdown breakdown={c.costBreakdown} currency={currency} locale={locale} dict={dict} />
          </section>
          <section>
            <h2 className="mb-6 text-2xl font-semibold">{t.byCampaign}</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] border-t border-graphite/60 text-left">
                <thead className="annot text-ink-500">
                  <tr className="border-b border-graphite/30">
                    <th scope="col" className="py-3 pr-4 font-normal">{t.campaign}</th>
                    <th scope="col" className="py-3 pr-4 text-right font-normal">{t.goal}</th>
                    <th scope="col" className="py-3 pr-4 text-right font-normal">{t.received2}</th>
                    <th scope="col" className="py-3 text-right font-normal">{t.spent}</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {site.campaigns.map((k) => (
                    <tr key={k.id} className="border-b border-graphite/20">
                      <th scope="row" className="py-3 pr-4 font-medium"><Link className="underline decoration-graphite/40 underline-offset-4 hover:decoration-sunrise-500" href={href(locale, `/campaigns/${k.slug}`)}>{pickText(k.title, locale)}</Link></th>
                      <td className="py-3 pr-4 text-right">{money(k.goalMinor, k.currency)}</td>
                      <td className="py-3 pr-4 text-right">{money(k.receivedMinor, k.currency)}</td>
                      <td className="py-3 text-right">{money(k.spentMinor, k.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="hatch mt-20 border border-graphite/30 p-6 sm:p-8">
          <h2 className="annot mb-4 text-ink-700">{t.caveatsTitle}</h2>
          <ul className="max-w-3xl space-y-2 text-ink-700">
            {t.caveats.map((line) => <li key={line} className="flex gap-3"><span className="mt-2.5 size-1.5 shrink-0 rotate-45 bg-sunrise-500" aria-hidden="true" />{line}</li>)}
          </ul>
        </section>
      </Container>
    </>
  );
}
