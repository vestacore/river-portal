import type { ReactNode } from 'react';
import { pickText } from '@river/i18n';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { resolveLocale } from '@/lib/resolveLocale';
import { currentActor } from '@/lib/session';
import { world } from '@/lib/world';

/** The frame of the public site: its header and footer around every landing and article page. */
export default async function SiteLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const actor = await currentActor();
  const person = actor ? world().people.find((p) => p.id === actor.personId) : undefined;
  return (
    <>
      <SiteHeader locale={locale} actor={actor} personName={person ? pickText(person.name, locale) : null} />
      <main id="main">{children}</main>
      <SiteFooter locale={locale} />
    </>
  );
}
