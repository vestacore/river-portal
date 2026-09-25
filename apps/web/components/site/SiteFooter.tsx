import Link from 'next/link';
import type { BlockMap } from '@river/content';
import { pickText, type Locale } from '@river/i18n';
import { settingLocalised, type SettingsSnapshot } from '@river/settings';
import type { Dictionary } from '@/lib/dictionary/types';
import { href } from '@/lib/href';
import { LogoMark } from './LogoMark';
import { SiteText } from './SiteText';

/** Footer as the title block of a drawing: organisation, links, policies, principles, legal line. */
export function SiteFooter({ locale, dict, blocks, settings }: { locale: Locale; dict: Dictionary; blocks: BlockMap; settings: SettingsSnapshot }) {
  const cell = 'border-graphite/25 p-6 sm:p-7';
  const a = 'text-ink-700 hover:text-ink-900 hover:underline';
  const legal = [pickText(settingLocalised(settings, 'org.legalName'), locale), pickText(settingLocalised(settings, 'org.registration'), locale)].filter(Boolean).join(' · ');
  return (
    <footer className="mt-8 border-t border-graphite/70 bg-paper">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid border-x border-graphite/25 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className={`${cell} border-b md:border-b-0 md:border-r`}>
            <div className="flex items-center gap-3"><LogoMark className="size-8" /><span className="font-display text-lg font-semibold text-ink-900">{pickText(settingLocalised(settings, 'org.name'), locale)}</span></div>
            <SiteText blocks={blocks} blockId="footer.note" locale={locale} className="mt-4 max-w-md text-[0.95rem] text-ink-500" />
          </div>
          <nav className={`${cell} border-b md:border-b-0 md:border-r`} aria-label="Footer">
            <ul className="space-y-2.5 text-[0.95rem]">
              <li><Link className={a} href={href(locale, '/ask')}>{dict.nav.ask}</Link></li>
              <li><Link className={a} href={href(locale, '/give')}>{dict.nav.give}</Link></li>
              <li><Link className={a} href={href(locale, '/about')}>{dict.nav.about}</Link></li>
              <li><Link className={a} href={href(locale, '/transparency')}>{dict.nav.transparency}</Link></li>
              <li><Link className={a} href={href(locale, '/contact')}>{dict.nav.contact}</Link></li>
              <li><Link className={a} href={href(locale, '/faq')}>{dict.nav.faq}</Link></li>
            </ul>
          </nav>
          <ul className={`${cell} space-y-2.5 border-b text-[0.95rem] md:border-b-0 md:border-r`}>
            {(['privacy', 'safeguarding', 'complaints', 'accessibility'] as const).map((slug) => <li key={slug}><Link className={a} href={href(locale, `/policies/${slug}`)}>{dict.policies[slug]}</Link></li>)}
          </ul>
          <ul className={`${cell} annot space-y-3 text-ink-700`}>
            {dict.footer.principles.map((p) => <li key={p} className="flex items-center gap-2"><span className="size-1.5 rotate-45 bg-sunrise-500" aria-hidden="true" />{p}</li>)}
          </ul>
        </div>
        <div className="annot grid border-x border-t border-graphite/25 text-ink-500 sm:grid-cols-[1fr_1fr_auto]">
          <span className="border-b border-graphite/25 px-6 py-3 sm:border-b-0 sm:border-r">{legal || dict.footer.drawnBy}</span>
          <span className="border-b border-graphite/25 px-6 py-3 sm:border-b-0 sm:border-r">{dict.footer.checkedBy}</span>
          <span className="px-6 py-3">River Portal · {dict.footer.revision} 2026-09</span>
        </div>
      </div>
    </footer>
  );
}
