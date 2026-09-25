import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { pickText } from '@river/i18n';
import { getRuntime } from '@river/runtime';
import { accentShades, settingLocalised, settingText } from '@river/settings';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { getIdentity } from '@/lib/getIdentity';
import { loadSettings } from '@/lib/loadSettings';
import { loadSite } from '@/lib/loadSite';
import { resolveLocale } from '@/lib/resolveLocale';
import '../globals.css';

// Lean font set for low bandwidth (V5): two weights, one italic, one mono; Latin and Cyrillic only.
const plexSans = IBM_Plex_Sans({ subsets: ['latin', 'cyrillic'], weight: ['400', '600'], style: ['normal', 'italic'], variable: '--font-plex-sans', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin', 'cyrillic'], weight: ['400'], variable: '--font-plex-mono', display: 'swap' });

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const settings = await loadSettings();
  const name = pickText(settingLocalised(settings, 'org.name'), locale);
  return {
    title: { default: `${name} — ${pickText(settingLocalised(settings, 'org.tagline'), locale)}`, template: `%s · ${name}` },
    description: pickText(settingLocalised(settings, 'org.scope'), locale),
    alternates: { languages: { 'en-GB': '/en-gb', uk: '/uk' } },
    icons: { icon: '/icon.svg' },
  };
}

export const viewport: Viewport = { themeColor: '#f7f5ef', width: 'device-width', initialScale: 1 };

export default async function LocaleLayout({ children, params }: Props) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const [site, settings, identity, runtime] = await Promise.all([loadSite(), loadSettings(), getIdentity(locale), getRuntime()]);
  const accent = accentShades(settingText(settings, 'appearance.accent'));
  return (
    <html lang={locale} className={`${plexSans.variable} ${plexMono.variable}`} data-scroll-behavior="smooth">
      <body className="min-h-dvh">
        <style>{`:root{--color-sunrise-100:${accent[100]};--color-sunrise-300:${accent[300]};--color-sunrise-500:${accent[500]};--color-sunrise-600:${accent[600]}}`}</style>
        <SiteHeader locale={locale} dict={dict} identity={identity} orgName={pickText(settingLocalised(settings, 'org.name'), locale)} demo={runtime.config.auth === 'demo'} />
        <main id="main">{children}</main>
        <SiteFooter locale={locale} dict={dict} blocks={site.blocks} settings={settings} />
      </body>
    </html>
  );
}
