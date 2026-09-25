import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { readConfig } from '@river/runtime';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { getStaff } from '@/lib/getStaff';
import { href } from '@/lib/href';
import { resolveLocale } from '@/lib/resolveLocale';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

/** Studio shell: only reachable with a verified staff identity (IAP in the cloud). */
export default async function StudioLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const staff = await getStaff();
  if (!staff) notFound();
  const t = getDictionary(locale).studio;
  const items = [
    ['/studio', t.nav.needs, 'inbox'], ['/studio/gifts', t.nav.gifts, 'hand'], ['/studio/reports', t.nav.reports, 'check'], ['/studio/feed', t.nav.feed, 'sparkle'],
  ] as const;
  return (
    <div className="min-h-[70vh]">
      <Container className="py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold">{t.title}</h1>
          <span className="border border-graphite/25 px-3 py-1.5 font-mono text-xs text-ink-500"><Icon name="shield" className="mr-1 inline size-3.5 text-teal-600" />{readConfig().surface === 'local' ? 'local development' : t.surfaceNote} <b className="text-ink-900">{staff.email}</b> · {staff.role}</span>
        </div>
        <nav className="mb-8 flex gap-6 overflow-x-auto border-b border-graphite/25" aria-label={t.title}>
          {items.map(([path, label, icon]) => (
            <Link key={path} href={href(locale, path)} className="-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-1 py-3 text-sm font-semibold text-ink-700 hover:border-sunrise-500 hover:text-ink-900"><Icon name={icon} className="size-4" />{label}</Link>
          ))}
        </nav>
        {children}
      </Container>
    </div>
  );
}
