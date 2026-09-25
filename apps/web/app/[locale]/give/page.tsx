import type { Metadata } from 'next';
import { formatMoney, pickText } from '@river/i18n';
import { settingEntries, settingList, settingLocalised, settingText, type DropOffEntry } from '@river/settings';
import { SiteText } from '@/components/site/SiteText';
import { Container } from '@/components/ui/Container';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { loadSettings } from '@/lib/loadSettings';
import { loadSite } from '@/lib/loadSite';
import { resolveLocale } from '@/lib/resolveLocale';
import { GiveForm } from './GiveForm';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ campaign?: string; kind?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(resolveLocale((await params).locale)).nav.give };
}

/** Give: the kinds of gift and amounts the organisation has chosen in settings. */
export default async function GivePage({ params, searchParams }: Props) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const [site, settings] = await Promise.all([loadSite(), loadSettings()]);
  const { campaign, kind } = await searchParams;
  const currency = settingText(settings, 'money.reportingCurrency');
  const kinds = settingList<'money' | 'goods' | 'transport' | 'service' | 'time'>(settings, 'giving.kinds');
  const amounts = settingList<number>(settings, 'giving.suggestedAmounts').map((a) => ({ value: String(a), label: formatMoney(a * 100, currency, locale) }));
  const dropOff = settingEntries<DropOffEntry>(settings, 'giving.dropOff');
  const instructions = pickText(settingLocalised(settings, 'giving.instructions'), locale);
  return (
    <div className="paper-grid">
      <Container narrow className="py-14 sm:py-20">
        <SiteText blocks={site.blocks} blockId="give.title" locale={locale} as="h1" className="text-4xl font-semibold sm:text-5xl" />
        <SiteText blocks={site.blocks} blockId="give.lead" locale={locale} className="mt-4 text-lg" />
        <div className="sketch mt-12 bg-paper p-6 sm:p-10">
          <GiveForm
            t={dict.give}
            kinds={kinds}
            amounts={amounts}
            currency={currency}
            instructions={instructions}
            campaigns={site.campaigns.filter((c) => c.status === 'active').map((c) => ({ id: c.id, title: pickText(c.title, locale) }))}
            {...(campaign ? { campaignId: campaign } : {})}
            {...(kind && (kinds as string[]).includes(kind) ? { initialKind: kind } : {})}
          />
        </div>
        {dropOff.length > 0 ? (
          <aside className="mt-12">
            <h2 className="annot mb-3 text-ink-500">{dict.give.dropOff}</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {dropOff.map((d) => <li key={pickText(d.place, locale)} className="border-l-2 border-sunrise-500 pl-4"><b className="font-semibold">{pickText(d.place, locale)}</b><br /><span className="text-sm text-ink-500">{pickText(d.hours, locale)}</span></li>)}
            </ul>
          </aside>
        ) : null}
      </Container>
    </div>
  );
}
