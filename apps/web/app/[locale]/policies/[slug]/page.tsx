import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/site/PageHead';
import { SiteText } from '@/components/site/SiteText';
import { Container } from '@/components/ui/Container';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { loadSite } from '@/lib/loadSite';
import { resolveLocale } from '@/lib/resolveLocale';

const slugs = ['privacy', 'safeguarding', 'complaints', 'accessibility'] as const;
type Slug = (typeof slugs)[number];
type Props = { params: Promise<{ locale: string; slug: string }> };

const isSlug = (s: string): s is Slug => (slugs as readonly string[]).includes(s);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  return isSlug(slug) ? { title: getDictionary(resolveLocale(locale)).policies[slug] } : {};
}

/** A policy: privacy notice, safeguarding, complaints or accessibility; each a site text. */
export default async function PolicyPage({ params }: Props) {
  const { locale: segment, slug } = await params;
  if (!isSlug(slug)) notFound();
  const locale = resolveLocale(segment);
  const dict = getDictionary(locale);
  const site = await loadSite();
  return (
    <>
      <PageHead sheet={`${dict.common.sheet} 06 · ${slugs.indexOf(slug) + 1}/${slugs.length}`} title={dict.policies[slug]} />
      <Container className="grid gap-12 py-16 lg:grid-cols-[14rem_1fr]">
        <nav aria-label={dict.about.policies} className="lg:sticky lg:top-28 lg:self-start">
          <ul className="annot space-y-3">
            {slugs.map((s) => (
              <li key={s}><Link href={href(locale, `/policies/${s}`)} aria-current={s === slug ? 'page' : undefined} className={s === slug ? 'text-ink-900 underline decoration-sunrise-500 decoration-2 underline-offset-[6px]' : 'text-ink-500 hover:text-ink-900'}>{dict.policies[s]}</Link></li>
            ))}
          </ul>
        </nav>
        <SiteText blocks={site.blocks} blockId={`policy.${slug}`} locale={locale} className="max-w-3xl text-lg" />
      </Container>
    </>
  );
}
