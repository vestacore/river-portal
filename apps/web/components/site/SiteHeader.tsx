import Link from 'next/link';
import { isStaff, type Identity } from '@river/identity';
import { segmentForLocale, type Locale } from '@river/i18n';
import type { Dictionary } from '@/lib/dictionary/types';
import { href } from '@/lib/href';
import { Icon } from '../ui/Icon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LogoMark } from './LogoMark';

/**
 * Header: navigation, language, the "Ask for help" call to action and, when someone is signed in,
 * who they are acting as with a link to their own place (My river or the studio).
 */
export function SiteHeader({ locale, dict, identity, orgName, demo }: { locale: Locale; dict: Dictionary; identity: Identity | null; orgName: string; demo: boolean }) {
  const link = 'whitespace-nowrap px-2 py-2 text-[0.95rem] font-medium text-ink-700 transition-colors hover:text-ink-900 hover:underline hover:decoration-sunrise-500 hover:decoration-2 hover:underline-offset-[6px]';
  const staff = isStaff(identity);
  const home = identity ? (staff ? '/studio' : '/me') : null;
  const nav = [
    ['/#campaigns', dict.nav.campaigns], ['/feed', dict.nav.whereHelpWent], ['/transparency', dict.nav.transparency], ['/about', dict.nav.about], ['/give', dict.nav.give],
  ] as const;
  return (
    <header className="sticky top-0 z-40 border-b border-graphite/20 bg-paper">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:bg-paper focus:px-4 focus:py-2">{dict.nav.skip}</a>
      {identity ? (
        <div className="annot flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-ink-900 px-4 py-1.5 text-paper">
          <span>{dict.nav.actingAs} <b className="font-medium text-sunrise-300">{identity.name}</b> · {identity.roles.map((r) => dict.roles[r]).join(', ')}</span>
          {home ? <Link className="underline decoration-sunrise-500 underline-offset-4" href={href(locale, home)}>{staff ? dict.nav.studio : dict.nav.myRiver}</Link> : null}
          {demo ? <Link className="underline decoration-graphite underline-offset-4" href={href(locale, '/demo')}>{dict.nav.switch}</Link> : null}
        </div>
      ) : null}
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href={href(locale)} className="flex min-w-0 items-center gap-3">
          <LogoMark />
          <span className="truncate font-display text-[1.05rem] font-semibold tracking-tight text-ink-900">{orgName}</span>
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-4">
          {!identity && demo ? <Link href={href(locale, '/demo')} className="annot hidden border border-graphite/30 px-2.5 py-1.5 text-ink-700 hover:border-graphite sm:inline-flex">{dict.nav.tryAs}</Link> : null}
          <LanguageSwitcher current={segmentForLocale(locale)} label={dict.nav.language} />
          <Link href={href(locale, '/ask')} className="chamfer hidden whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-ink-900 [--cut:7px] [--fill:var(--color-sunrise-500)] hover:[--fill:var(--color-sunrise-300)] sm:inline-flex">
            <Icon name="hand" className="mr-1.5 size-4" />{dict.nav.ask}
          </Link>
        </div>
      </div>
      {/* The second row holds the navigation on every screen, so long names and languages never collide. */}
      <nav className="border-t border-graphite/10" aria-label="Main">
        <div className="mx-auto flex max-w-6xl gap-3 overflow-x-auto px-2 sm:px-4 lg:px-6">
          <Link className={`${link} sm:hidden`} href={href(locale, '/ask')}>{dict.nav.ask}</Link>
          {nav.map(([path, label]) => <Link key={path} className={link} href={href(locale, path)}>{label}</Link>)}
          {!identity && demo ? <Link className={`${link} sm:hidden`} href={href(locale, '/demo')}>{dict.nav.tryAs}</Link> : null}
        </div>
      </nav>
    </header>
  );
}
