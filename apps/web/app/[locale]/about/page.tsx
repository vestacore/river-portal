import type { Metadata } from 'next';
import Link from 'next/link';
import { listOblasts, oblastName, pickText } from '@river/i18n';
import { findCategory } from '@river/needs';
import { settingEntries, settingList, settingLocalised, settingNumber, settingText, type PartnerEntry } from '@river/settings';
import { FactTable } from '@/components/site/FactTable';
import { PageHead } from '@/components/site/PageHead';
import { SiteText } from '@/components/site/SiteText';
import { Container } from '@/components/ui/Container';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { loadSettings } from '@/lib/loadSettings';
import { loadSite } from '@/lib/loadSite';
import { resolveLocale } from '@/lib/resolveLocale';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(resolveLocale((await params).locale)).about.title };
}

/** Who we are: the organisation's own words (a site text) and the facts from settings. */
export default async function AboutPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const [site, settings] = await Promise.all([loadSite(), loadSettings()]);
  const areas = settingList<string>(settings, 'org.areasServed');
  const kinds = settingList<string>(settings, 'org.helpKinds').map((id) => pickText(findCategory(id)?.label, locale)).filter(Boolean);
  const partners = settingEntries<PartnerEntry>(settings, 'org.partners');
  const a = 'text-ink-700 underline decoration-graphite/40 underline-offset-4 hover:text-ink-900';
  return (
    <>
      <PageHead sheet={`${dict.common.sheet} 02`} title={dict.about.title} lead={pickText(settingLocalised(settings, 'org.scope'), locale)} />
      <Container className="grid gap-16 py-16 lg:grid-cols-[1.35fr_1fr]">
        <SiteText blocks={site.blocks} blockId="about.body" locale={locale} className="text-lg" />
        <aside className="space-y-12">
          <section>
            <h2 className="annot mb-3 text-ink-500">{dict.about.facts}</h2>
            <FactTable rows={[
              [dict.about.legalName, pickText(settingLocalised(settings, 'org.legalName'), locale)],
              [dict.about.registration, pickText(settingLocalised(settings, 'org.registration'), locale)],
              [dict.about.founded, String(settingNumber(settings, 'org.foundedYear'))],
              [dict.about.areas, areas.length >= listOblasts(locale).length ? dict.about.allAreas : areas.map((id) => oblastName(id, locale)).join(', ')],
              [dict.about.kinds, kinds.join(', ')],
              [dict.about.contact, <Link key="c" className={a} href={href(locale, '/contact')}>{settingText(settings, 'contact.email')}</Link>],
            ]} />
          </section>
          {partners.length > 0 ? (
            <section>
              <h2 className="annot mb-3 text-ink-500">{dict.about.partners}</h2>
              <ul className="space-y-3">
                {partners.map((p) => (
                  <li key={p.name} className="border-l-2 border-teal-500 pl-4">
                    {p.url ? <a className="font-semibold text-ink-900 underline decoration-graphite/40 underline-offset-4" href={p.url} rel="noopener noreferrer">{p.name}</a> : <b className="font-semibold">{p.name}</b>}
                    <p className="text-sm text-ink-500">{pickText(p.role, locale)}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section>
            <h2 className="annot mb-3 text-ink-500">{dict.about.policies}</h2>
            <ul className="space-y-2">
              {(['privacy', 'safeguarding', 'complaints', 'accessibility'] as const).map((slug) => <li key={slug}><Link className={a} href={href(locale, `/policies/${slug}`)}>{dict.policies[slug]}</Link></li>)}
              <li><Link className={a} href={href(locale, '/transparency')}>{dict.transparency.title}</Link></li>
            </ul>
          </section>
        </aside>
      </Container>
    </>
  );
}
