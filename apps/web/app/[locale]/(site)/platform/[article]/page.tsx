import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AgentsArticle } from '@/components/articles/AgentsArticle';
import { articles } from '@/components/articles/ArticleFrame';
import { HierarchyArticle } from '@/components/articles/HierarchyArticle';
import { InstrumentsArticle } from '@/components/articles/InstrumentsArticle';
import { InvoicingArticle } from '@/components/articles/InvoicingArticle';
import { LifecycleArticle } from '@/components/articles/LifecycleArticle';
import { SplitArticle } from '@/components/articles/SplitArticle';
import { lt } from '@/lib/lt';
import { resolveLocale } from '@/lib/resolveLocale';
import { world } from '@/lib/world';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; article: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, article } = await params;
  const a = articles.find((x) => x.slug === article);
  return { title: a ? lt(resolveLocale(locale))(a.en, a.uk) : undefined };
}

/** The six articles of the platform. Each draws its figures from the demo stand itself. */
export default async function Article({ params }: Props) {
  const { locale: segment, article } = await params;
  const locale = resolveLocale(segment);
  const w = world();
  switch (article) {
    case 'split': return <SplitArticle locale={locale} w={w} />;
    case 'hierarchy': return <HierarchyArticle locale={locale} w={w} />;
    case 'instruments': return <InstrumentsArticle locale={locale} w={w} />;
    case 'lifecycle': return <LifecycleArticle locale={locale} w={w} />;
    case 'agents': return <AgentsArticle locale={locale} w={w} />;
    case 'invoicing': return <InvoicingArticle locale={locale} w={w} />;
    default: notFound();
  }
}
