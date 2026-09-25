import type { ReactNode } from 'react';
import { settingList, settingNumber } from '@river/settings';
import { AboutTeaser } from '@/components/site/AboutTeaser';
import { CampaignCard } from '@/components/site/CampaignCard';
import { CountersBand } from '@/components/site/CountersBand';
import { Doors } from '@/components/site/Doors';
import { FeedCard } from '@/components/site/FeedCard';
import { GratitudeCard } from '@/components/site/GratitudeCard';
import { Hero } from '@/components/site/Hero';
import { HowItWorks } from '@/components/site/HowItWorks';
import { ReportCard } from '@/components/site/ReportCard';
import { SiteText } from '@/components/site/SiteText';
import { TrustStrip } from '@/components/site/TrustStrip';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { loadSettings } from '@/lib/loadSettings';
import { loadSite } from '@/lib/loadSite';
import { resolveLocale } from '@/lib/resolveLocale';

export const revalidate = 30;

/** Home: sections chosen and ordered in settings (home.sections), rendered from one site document. */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const [site, settings] = await Promise.all([loadSite(), loadSettings()]);
  const sections = settingList(settings, 'home.sections');

  // Section numbers (§ 01, § 02, …) follow the order chosen in settings, like the sheets of a drawing.
  let numbered = 0;
  const next = () => String(++numbered).padStart(2, '0');

  const thanks = (index: string) => (
    <div className="chamfer px-7 py-10 [--cut:40px] [--fill:var(--color-sunrise-100)] sm:px-10">
      <SectionHeading index={index} title={<SiteText blocks={site.blocks} blockId="home.thanks.title" locale={locale} as="h2" />} />
      {site.gratitude.length === 0 ? <p className="text-ink-500">{dict.home.thanksEmpty}</p> : (
        <div className="grid gap-10">{site.gratitude.map((g) => <GratitudeCard key={g.id} card={g} locale={locale} />)}</div>
      )}
    </div>
  );
  const reports = (index: string) => (
    <div>
      <SectionHeading index={index} title={dict.home.reportsTitle} lead={dict.home.reportsLead} />
      <div>{site.reports.map((r) => <ReportCard key={r.id} report={r} locale={locale} dict={dict} />)}</div>
    </div>
  );
  const render: Record<string, () => ReactNode> = {
    hero: () => <Hero locale={locale} dict={dict} blocks={site.blocks} settings={settings} />,
    trust: () => <TrustStrip counters={site.counters} settings={settings} locale={locale} dict={dict} />,
    doors: () => <Doors settings={settings} locale={locale} dict={dict} />,
    counters: () => <section className="pt-4"><CountersBand counters={site.counters} settings={settings} locale={locale} dict={dict} /></section>,
    how: () => <HowItWorks locale={locale} dict={dict} blocks={site.blocks} index={next()} />,
    campaigns: () => (
      <section id="campaigns" className="scroll-mt-24 border-t border-graphite/15 py-24">
        <Container>
          <SectionHeading index={next()} title={dict.home.campaignsTitle} lead={dict.home.campaignsLead} />
          <div className="grid gap-10 md:grid-cols-2">{site.campaigns.map((c) => <CampaignCard key={c.id} campaign={c} locale={locale} dict={dict} />)}</div>
        </Container>
      </section>
    ),
    feed: () => {
      const count = settingNumber(settings, 'home.feedCount');
      if (count === 0) return null;
      return (
        <section className="border-t border-graphite/15 py-24">
          <Container>
            <SectionHeading index={next()} title={<SiteText blocks={site.blocks} blockId="home.feed.title" locale={locale} as="h2" />} lead={dict.feed.lead}
              action={<Button href={href(locale, '/feed')} variant="ghost">{dict.common.seeAll}<Icon name="arrow" className="size-4" /></Button>} />
            {site.feed.length === 0 ? <p className="text-ink-500">{dict.home.feedEmpty}</p> : (
              <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">{site.feed.slice(0, count).map((item) => <FeedCard key={item.id} item={item} locale={locale} dict={dict} />)}</div>
            )}
          </Container>
        </section>
      );
    },
    thanks: () => <section className="border-t border-graphite/15 py-24"><Container>{thanks(next())}</Container></section>,
    reports: () => <section className="border-t border-graphite/15 py-24"><Container>{reports(next())}</Container></section>,
    about: () => <AboutTeaser blocks={site.blocks} locale={locale} dict={dict} index={next()} />,
  };

  const out: ReactNode[] = [];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i] as string;
    // Thanks followed by reports share one section, side by side.
    if (s === 'thanks' && sections[i + 1] === 'reports') {
      out.push(
        <section key="thanks-reports" className="border-t border-graphite/15 py-24">
          <Container><div className="grid gap-16 lg:grid-cols-[1.15fr_1fr]">{thanks(next())}<div className="lg:pt-10">{reports(next())}</div></div></Container>
        </section>,
      );
      i++;
      continue;
    }
    const section = render[s];
    if (section) out.push(<div key={s}>{section()}</div>);
  }
  return <>{out}</>;
}
