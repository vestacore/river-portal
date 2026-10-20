import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { lt } from '@/lib/lt';
import { resolveLocale } from '@/lib/resolveLocale';
import '../globals.css';

// Lean font set: two weights, one italic, one mono; Latin and Cyrillic only.
const plexSans = IBM_Plex_Sans({ subsets: ['latin', 'cyrillic'], weight: ['400', '600'], style: ['normal', 'italic'], variable: '--font-plex-sans', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin', 'cyrillic'], weight: ['400', '600'], variable: '--font-plex-mono', display: 'swap' });

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const t = lt(resolveLocale((await params).locale));
  return {
    title: { default: t('River Pay — every payment is a river', 'River Pay — кожен платіж є рікою'), template: '%s · River Pay' },
    description: t('A payment platform where one attempt to pay is a river from unpaid to paid: split payments, a hierarchy of units, every instrument first-class, agents that propose and people who decide.', 'Платіжна платформа, де одна спроба оплати — це ріка від несплаченого до сплаченого: розщеплення платежів, ієрархія одиниць, усі інструменти рівноправні, агенти пропонують — люди вирішують.'),
    alternates: { languages: { 'en-GB': '/en-gb', uk: '/uk' } },
    icons: { icon: '/icon.svg' },
  };
}

export const viewport: Viewport = { themeColor: '#f7f5ef', width: 'device-width', initialScale: 1 };

/** The root of every page: language, fonts and the paper. Each area draws its own frame. */
export default async function LocaleLayout({ children, params }: Props) {
  const locale = resolveLocale((await params).locale);
  return (
    <html lang={locale} className={`${plexSans.variable} ${plexMono.variable}`} data-scroll-behavior="smooth">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
