import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Locale } from '@river/i18n';
import { href } from '@/lib/href';
import { lt } from '@/lib/lt';
import { Container } from '../ui/Container';
import { Icon } from '../ui/Icon';

export const articles = [
  { slug: 'split', icon: 'split', en: 'Split payments', uk: 'Розщеплення платежів' },
  { slug: 'hierarchy', icon: 'tree', en: 'The hierarchy of units', uk: 'Ієрархія одиниць' },
  { slug: 'instruments', icon: 'layers', en: 'Payment instruments', uk: 'Платіжні інструменти' },
  { slug: 'lifecycle', icon: 'bridge', en: 'Lifecycle and projections', uk: 'Життєвий цикл і проєкції' },
  { slug: 'agents', icon: 'bot', en: 'The agent swarm', uk: 'Рій агентів' },
  { slug: 'invoicing', icon: 'invoice', en: 'Invoices, orders, tracking', uk: 'Інвойси, замовлення, відстеження' },
] as const;

/**
 * The frame of an article: a drawing sheet's head (number, title, lead), the body in a reading column
 * beside a margin that lists the other articles, and a closing band that leads into the demo.
 */
export function ArticleFrame({ locale, slug, sheet, title, lead, children, cta }: { locale: Locale; slug: string; sheet: string; title: string; lead: string; children: ReactNode; cta: { label: string; path: string } }) {
  const t = lt(locale);
  return (
    <>
      <header className="paper-grid border-b border-graphite/15">
        <Container className="py-14 sm:py-20">
          <p className="annot mb-5 flex items-center gap-3 text-ink-500"><span className="text-sunrise-600">{t('Sheet', 'Аркуш')} {sheet}</span><span className="h-px w-12 bg-graphite/40" aria-hidden="true" /><span>{t('Platform', 'Платформа')}</span></p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-lg text-ink-700 sm:text-xl">{lead}</p>
        </Container>
      </header>
      <Container className="grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <article className="min-w-0 space-y-14">{children}</article>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="annot mb-3 text-ink-500">{t('The six themes', 'Шість тем')}</p>
          <ol className="space-y-1">
            {articles.map((a, i) => (
              <li key={a.slug}>
                <Link href={href(locale, `/platform/${a.slug}`)} aria-current={a.slug === slug ? 'page' : undefined} className={`flex items-center gap-2.5 border-l-2 px-3 py-1.5 text-[0.9rem] ${a.slug === slug ? 'border-sunrise-500 font-semibold text-ink-900' : 'border-transparent text-ink-700 hover:border-graphite/40'}`}>
                  <span className="font-mono text-[0.7rem] text-ink-500">{String(i + 1).padStart(2, '0')}</span>{t(a.en, a.uk)}
                </Link>
              </li>
            ))}
          </ol>
          <Link href={href(locale, cta.path)} className="chamfer mt-6 flex items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-ink-900 [--cut:8px] [--fill:var(--color-sunrise-500)]">{cta.label}<Icon name="arrow" className="size-4" /></Link>
        </aside>
      </Container>
    </>
  );
}

/** A section of an article: a numbered heading and its body. */
export function Section({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section>
      <p className="annot mb-3 flex items-center gap-3 text-ink-500"><span className="text-sunrise-600">§ {index}</span><span className="h-px w-12 bg-graphite/40" aria-hidden="true" /></p>
      <h2 className="text-2xl font-semibold text-ink-900 sm:text-[2rem]">{title}</h2>
      <div className="prose-river mt-5 max-w-3xl text-ink-700">{children}</div>
    </section>
  );
}

/** A figure of an article: the drawing or the live panel, and its caption like a drawing's. */
export function Figure({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className="not-prose my-8">
      <div className="overflow-x-auto border border-graphite/20 bg-paper p-4">{children}</div>
      <figcaption className="annot mt-3 flex items-center gap-3 text-ink-500"><span className="h-px w-8 bg-graphite/40" aria-hidden="true" />{caption}</figcaption>
    </figure>
  );
}
