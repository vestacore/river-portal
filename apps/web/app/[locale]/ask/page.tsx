import type { Metadata } from 'next';
import { listOblasts, pickText, segmentForLocale } from '@river/i18n';
import { listCategories } from '@river/needs';
import { settingLocalised } from '@river/settings';
import { HelpAside } from '@/components/site/HelpAside';
import { QuickExitFor } from '@/components/site/QuickExitFor';
import { SiteText } from '@/components/site/SiteText';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { loadSettings } from '@/lib/loadSettings';
import { loadSite } from '@/lib/loadSite';
import { resolveLocale } from '@/lib/resolveLocale';
import { AskForm } from './AskForm';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(resolveLocale((await params).locale)).nav.ask, referrer: 'no-referrer' };
}

/** Ask for help: the simplest possible path, always open, with a way out and other ways in. */
export default async function AskPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const [site, settings] = await Promise.all([loadSite(), loadSettings()]);
  const emergency = pickText(settingLocalised(settings, 'help.emergency'), locale);
  return (
    <div className="paper-grid">
      <QuickExitFor settings={settings} dict={dict} />
      <Container narrow className="py-14 sm:py-20">
        {emergency ? (
          <p role="note" className="mb-10 flex items-start gap-3 border-l-2 border-attention-500 bg-paper px-4 py-3 font-medium text-ink-900">
            <Icon name="shield" className="mt-0.5 size-5 shrink-0 text-attention-500" />{emergency}
          </p>
        ) : null}
        <SiteText blocks={site.blocks} blockId="ask.title" locale={locale} as="h1" className="text-4xl font-semibold sm:text-5xl" />
        <SiteText blocks={site.blocks} blockId="ask.lead" locale={locale} className="mt-4 text-lg" />
        <div className="sketch mt-12 bg-paper p-6 sm:p-10">
          <AskForm
            localeSegment={segmentForLocale(locale)}
            t={dict.ask}
            categories={listCategories().map((c) => ({ id: c.id, icon: c.icon, label: pickText(c.label, locale) }))}
            oblasts={listOblasts(locale)}
          />
        </div>
        <HelpAside settings={settings} locale={locale} dict={dict} />
      </Container>
    </div>
  );
}
