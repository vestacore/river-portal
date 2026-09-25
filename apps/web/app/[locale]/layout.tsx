import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { getStaff } from '@/lib/getStaff';
import { isEditMode } from '@/lib/isEditMode';
import { loadSite } from '@/lib/loadSite';
import { resolveLocale } from '@/lib/resolveLocale';
import '../globals.css';

const plexSans = IBM_Plex_Sans({ subsets: ['latin', 'cyrillic', 'cyrillic-ext'], weight: ['300', '400', '500', '600', '700'], style: ['normal', 'italic'], variable: '--font-plex-sans', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin', 'cyrillic'], weight: ['400', '500'], variable: '--font-plex-mono', display: 'swap' });

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const dict = getDictionary(resolveLocale((await params).locale));
  return {
    title: { default: dict.meta.title, template: `%s · ${dict.org.name}` },
    description: dict.meta.description,
    alternates: { languages: { 'en-GB': '/en-gb', uk: '/uk' } },
    icons: { icon: '/icon.svg' },
  };
}

export const viewport: Viewport = { themeColor: '#f7f5ef', width: 'device-width', initialScale: 1 };

export default async function LocaleLayout({ children, params }: Props) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const [site, staff, editMode] = await Promise.all([loadSite(), getStaff(), isEditMode()]);
  return (
    <html lang={locale} className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh">
        <SiteHeader locale={locale} dict={dict} staff={staff} editMode={editMode} />
        <main id="main">{children}</main>
        <SiteFooter locale={locale} dict={dict} blocks={site.blocks} />
      </body>
    </html>
  );
}
