import type { Metadata } from 'next';
import { PageHead } from '@/components/site/PageHead';
import { SiteText } from '@/components/site/SiteText';
import { Container } from '@/components/ui/Container';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { loadSite } from '@/lib/loadSite';
import { resolveLocale } from '@/lib/resolveLocale';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(resolveLocale((await params).locale)).faqPage.title };
}

/** Questions and answers: one site text, edited in the studio. */
export default async function FaqPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const site = await loadSite();
  return (
    <>
      <PageHead sheet={`${dict.common.sheet} 05`} title={dict.faqPage.title} />
      <Container narrow className="py-16">
        <SiteText blocks={site.blocks} blockId="faq.body" locale={locale} className="text-lg" />
      </Container>
    </>
  );
}
