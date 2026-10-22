import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AgentsArticle } from '@/components/articles/AgentsArticle';
import { articles } from '@/components/articles/ArticleFrame';
import { HierarchyArticle } from '@/components/articles/HierarchyArticle';
import { InstrumentsArticle } from '@/components/articles/InstrumentsArticle';
import { InvoicingArticle } from '@/components/articles/InvoicingArticle';
import { LifecycleArticle } from '@/components/articles/LifecycleArticle';
import { ReconciliationArticle } from '@/components/articles/ReconciliationArticle';
import { RoutingArticle } from '@/components/articles/RoutingArticle';
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

/** The articles of the platform. Each draws its figures from the demo stands themselves: the retail group first, the PSP where it shows more. */
export default async function Article({ params }: Props) {
  const { locale: segment, article } = await params;
  const locale = resolveLocale(segment);
  if (!articles.some((a) => a.slug === article)) notFound();
  const worlds = { retail: world('retail'), psp: world('psp') };
  switch (article) {
    case 'routing': return <RoutingArticle locale={locale} worlds={worlds} />;
    case 'reconciliation': return <ReconciliationArticle locale={locale} worlds={worlds} />;
    case 'lifecycle': return <LifecycleArticle locale={locale} worlds={worlds} />;
    case 'instruments': return <InstrumentsArticle locale={locale} worlds={worlds} />;
    case 'hierarchy': return <HierarchyArticle locale={locale} worlds={worlds} />;
    case 'invoicing': return <InvoicingArticle locale={locale} worlds={worlds} />;
    case 'split': return <SplitArticle locale={locale} worlds={worlds} />;
    case 'agents': return <AgentsArticle locale={locale} worlds={worlds} />;
    default: notFound();
  }
}
