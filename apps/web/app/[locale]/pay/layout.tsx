import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getPayRuntime } from '@river/pay-runtime';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { resolveLocale } from '@/lib/resolveLocale';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: getDictionary(resolveLocale((await params).locale)).pay.title, robots: { index: false, follow: false }, referrer: 'no-referrer' };
}

/**
 * The payment river's pages (adr/records/ADR-0025). Where a provider is mounted as a stand-in, every
 * page says so at the top: an order "paid" there moved no money. Where none is mounted, there is no river.
 */
export default async function PayLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const dict = getDictionary(resolveLocale((await params).locale));
  const { config } = await getPayRuntime();
  // A deployment that mounts no provider has no payment river: its pages do not exist.
  if (config.door.at === 'here' && config.stripe.mode === 'off' && config.paypal.mode === 'off') notFound();
  const standIn = config.stripe.mode === 'simulated' || config.paypal.mode === 'simulated';
  return (
    <>
      {standIn ? <p className="annot border-b border-graphite/20 bg-sunrise-100 px-4 py-2 text-center text-ink-900">{dict.pay.sandbox}</p> : null}
      {children}
    </>
  );
}
