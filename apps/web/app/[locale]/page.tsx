import { CampaignCard } from '@/components/site/CampaignCard';
import { CountersBand } from '@/components/site/CountersBand';
import { FeedCard } from '@/components/site/FeedCard';
import { GratitudeCard } from '@/components/site/GratitudeCard';
import { Hero } from '@/components/site/Hero';
import { HowItWorks } from '@/components/site/HowItWorks';
import { ReportCard } from '@/components/site/ReportCard';
import { Editable } from '@/components/edit/Editable';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { loadSite } from '@/lib/loadSite';
import { resolveLocale } from '@/lib/resolveLocale';

export const revalidate = 30;

/** Home: rendered from a single site document, laid out as numbered sheets of one drawing. */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const site = await loadSite();
  return (
    <>
      <Hero locale={locale} dict={dict} blocks={site.blocks} />
      <CountersBand counters={site.counters} locale={locale} dict={dict} />
      <HowItWorks locale={locale} dict={dict} blocks={site.blocks} />

      <section id="campaigns" className="scroll-mt-24 border-t border-graphite/15 py-24">
        <Container>
          <SectionHeading index="02" title={dict.home.campaignsTitle} lead={dict.home.campaignsLead} />
          <div className="grid gap-10 md:grid-cols-2">
            {site.campaigns.map((c) => <CampaignCard key={c.id} campaign={c} locale={locale} dict={dict} />)}
          </div>
        </Container>
      </section>

      <section className="border-t border-graphite/15 py-24">
        <Container>
          <SectionHeading
            index="03"
            title={<Editable blocks={site.blocks} blockId="home.feed.title" locale={locale} as="h2" />}
            lead={dict.feed.lead}
            action={<Button href={href(locale, '/feed')} variant="ghost">{dict.common.seeAll}<Icon name="arrow" className="size-4" /></Button>}
          />
          {site.feed.length === 0 ? <p className="text-ink-500">{dict.home.feedEmpty}</p> : (
            <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {site.feed.slice(0, 3).map((item) => <FeedCard key={item.id} item={item} locale={locale} dict={dict} />)}
            </div>
          )}
        </Container>
      </section>

      <section className="border-t border-graphite/15 py-24">
        <Container>
          <div className="grid gap-16 lg:grid-cols-[1.15fr_1fr]">
            <div className="chamfer px-7 py-10 [--cut:40px] [--fill:var(--color-sunrise-100)] sm:px-10">
              <SectionHeading index="04" title={<Editable blocks={site.blocks} blockId="home.thanks.title" locale={locale} as="h2" />} />
              {site.gratitude.length === 0 ? <p className="text-ink-500">{dict.home.thanksEmpty}</p> : (
                <div className="grid gap-10">{site.gratitude.map((g) => <GratitudeCard key={g.id} card={g} locale={locale} />)}</div>
              )}
            </div>
            <div className="lg:pt-10">
              <SectionHeading index="05" title={dict.home.reportsTitle} lead={dict.home.reportsLead} />
              <div>{site.reports.map((r) => <ReportCard key={r.id} report={r} locale={locale} dict={dict} />)}</div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
