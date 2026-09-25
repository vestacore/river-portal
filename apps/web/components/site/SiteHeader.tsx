import Link from 'next/link';
import { segmentForLocale, type Locale } from '@river/i18n';
import { setEditModeAction } from '@/lib/actions/siteActions';
import type { Dictionary } from '@/lib/dictionary/types';
import type { Staff } from '@/lib/getStaff';
import { href } from '@/lib/href';
import { Icon } from '../ui/Icon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LogoMark } from './LogoMark';

/** Sticky, translucent header with navigation, language switch and (for staff) the edit toggle. */
export function SiteHeader({ locale, dict, staff, editMode }: { locale: Locale; dict: Dictionary; staff: Staff | null; editMode: boolean }) {
  const link = 'whitespace-nowrap px-2 py-2 text-[0.95rem] font-medium text-ink-700 transition-colors hover:text-ink-900 hover:underline hover:decoration-sunrise-500 hover:decoration-2 hover:underline-offset-[6px]';
  return (
    <header className="sticky top-0 z-40 border-b border-graphite/20 bg-paper">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:bg-paper focus:px-4 focus:py-2">{dict.nav.skip}</a>
      {editMode ? (
        <div className="annot bg-sunrise-500 px-4 py-2 text-center text-ink-900">
          <Icon name="pen" className="mr-2 inline size-3.5" />{dict.edit.hint}
        </div>
      ) : null}
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href={href(locale)} className="flex items-center gap-3">
          <LogoMark />
          <span className="whitespace-nowrap font-display text-[1.05rem] font-semibold tracking-tight text-ink-900">{dict.org.name}</span>
        </Link>
        <nav className="ml-auto hidden items-center gap-3 lg:flex" aria-label="Main">
          <Link className={link} href={href(locale, '/#campaigns')}>{dict.nav.campaigns}</Link>
          <Link className={link} href={href(locale, '/feed')}>{dict.nav.feed}</Link>
          <Link className={link} href={href(locale, '/give')}>{dict.nav.give}</Link>
          {staff ? <Link className={link} href={href(locale, '/studio')}>{dict.nav.studio}</Link> : null}
        </nav>
        <div className="ml-auto flex items-center gap-4 lg:ml-4">
          {staff ? (
            <form action={setEditModeAction}>
              <input type="hidden" name="mode" value={editMode ? 'off' : 'on'} />
              <button type="submit" title={editMode ? dict.edit.on : dict.edit.off} className={`annot inline-flex items-center gap-1.5 border px-2.5 py-1.5 transition-colors ${editMode ? 'border-sunrise-500 bg-sunrise-500 text-ink-900' : 'border-graphite/30 text-ink-700 hover:border-graphite'}`}>
                <Icon name="pen" className="size-3.5" /><span className="hidden whitespace-nowrap xl:inline">{editMode ? dict.edit.on : dict.edit.off}</span>
              </button>
            </form>
          ) : null}
          <LanguageSwitcher current={segmentForLocale(locale)} label={dict.nav.language} />
          <Link href={href(locale, '/ask')} className="chamfer hidden whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-ink-900 [--cut:7px] [--fill:var(--color-sunrise-500)] hover:[--fill:var(--color-sunrise-300)] sm:inline-flex">{dict.nav.ask}</Link>
        </div>
      </div>
      <nav className="flex gap-3 overflow-x-auto border-t border-graphite/10 px-3 py-1 lg:hidden" aria-label="Main">
        <Link className={link} href={href(locale, '/ask')}>{dict.nav.ask}</Link>
        <Link className={link} href={href(locale, '/give')}>{dict.nav.give}</Link>
        <Link className={link} href={href(locale, '/feed')}>{dict.nav.feed}</Link>
        {staff ? <Link className={link} href={href(locale, '/studio')}>{dict.nav.studio}</Link> : null}
      </nav>
    </header>
  );
}
