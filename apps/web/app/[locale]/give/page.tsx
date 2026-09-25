import type { Metadata } from 'next';
import { pickText } from '@river/i18n';
import { Editable } from '@/components/edit/Editable';
import { Container } from '@/components/ui/Container';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { loadSite } from '@/lib/loadSite';
import { resolveLocale } from '@/lib/resolveLocale';
import { GiveForm } from './GiveForm';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ campaign?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(resolveLocale((await params).locale)).nav.give };
}

/** Give: share money, things, transport, a service or time. */
export default async function GivePage({ params, searchParams }: Props) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const site = await loadSite();
  const { campaign } = await searchParams;
  return (
    <div className="paper-grid">
      <Container narrow className="py-14 sm:py-20">
        <Editable blocks={site.blocks} blockId="give.title" locale={locale} as="h1" className="text-4xl font-extrabold sm:text-5xl" />
        <Editable blocks={site.blocks} blockId="give.lead" locale={locale} className="mt-4 text-lg" />
        <div className="sketch mt-12 bg-paper p-6 sm:p-10">
          <GiveForm t={dict.give} campaigns={site.campaigns.filter((c) => c.status === 'active').map((c) => ({ id: c.id, title: pickText(c.title, locale) }))} {...(campaign ? { campaignId: campaign } : {})} />
        </div>
      </Container>
    </div>
  );
}
