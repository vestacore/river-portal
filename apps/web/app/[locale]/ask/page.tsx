import type { Metadata } from 'next';
import { listOblasts, pickText } from '@river/i18n';
import { listCategories } from '@river/needs';
import { segmentForLocale } from '@river/i18n';
import { Editable } from '@/components/edit/Editable';
import { Container } from '@/components/ui/Container';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { loadSite } from '@/lib/loadSite';
import { resolveLocale } from '@/lib/resolveLocale';
import { AskForm } from './AskForm';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(resolveLocale((await params).locale)).nav.ask };
}

/** Ask for help: the simplest possible path, always open. */
export default async function AskPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const site = await loadSite();
  return (
    <div className="paper-grid">
      <Container narrow className="py-14 sm:py-20">
        <Editable blocks={site.blocks} blockId="ask.title" locale={locale} as="h1" className="text-4xl font-extrabold sm:text-5xl" />
        <Editable blocks={site.blocks} blockId="ask.lead" locale={locale} className="mt-4 text-lg" />
        <div className="sketch mt-12 bg-paper p-6 sm:p-10">
          <AskForm
            localeSegment={segmentForLocale(locale)}
            t={dict.ask}
            categories={listCategories().map((c) => ({ id: c.id, icon: c.icon, label: pickText(c.label, locale) }))}
            oblasts={listOblasts(locale)}
          />
        </div>
      </Container>
    </div>
  );
}
