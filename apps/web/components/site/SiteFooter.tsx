import Link from 'next/link';
import type { BlockMap } from '@river/content';
import type { Locale } from '@river/i18n';
import type { Dictionary } from '@/lib/dictionary/types';
import { href } from '@/lib/href';
import { Editable } from '../edit/Editable';
import { LogoMark } from './LogoMark';

/** Footer as the title block of a drawing: organisation, navigation, principles, revision. */
export function SiteFooter({ locale, dict, blocks }: { locale: Locale; dict: Dictionary; blocks: BlockMap }) {
  const cell = 'border-graphite/25 p-6 sm:p-7';
  return (
    <footer className="mt-8 border-t border-graphite/70 bg-paper">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid border-x border-graphite/25 md:grid-cols-[1.6fr_1fr_1fr]">
          <div className={`${cell} border-b md:border-b-0 md:border-r`}>
            <div className="flex items-center gap-3"><LogoMark className="size-8" /><span className="font-display text-lg font-semibold text-ink-900">{dict.org.name}</span></div>
            <Editable blocks={blocks} blockId="footer.note" locale={locale} className="mt-4 max-w-md text-[0.95rem] text-ink-500" />
          </div>
          <nav className={`${cell} border-b md:border-b-0 md:border-r`} aria-label="Footer">
            <ul className="space-y-2.5 text-[0.95rem]">
              <li><Link className="text-ink-700 hover:text-ink-900 hover:underline" href={href(locale, '/ask')}>{dict.nav.ask}</Link></li>
              <li><Link className="text-ink-700 hover:text-ink-900 hover:underline" href={href(locale, '/give')}>{dict.nav.give}</Link></li>
              <li><Link className="text-ink-700 hover:text-ink-900 hover:underline" href={href(locale, '/#campaigns')}>{dict.nav.campaigns}</Link></li>
              <li><Link className="text-ink-700 hover:text-ink-900 hover:underline" href={href(locale, '/feed')}>{dict.nav.feed}</Link></li>
            </ul>
          </nav>
          <ul className={`${cell} annot space-y-3 text-ink-700`}>
            {dict.footer.principles.map((p) => <li key={p} className="flex items-center gap-2"><span className="size-1.5 rotate-45 bg-sunrise-500" aria-hidden="true" />{p}</li>)}
          </ul>
        </div>
        <div className="annot grid border-x border-t border-graphite/25 text-ink-500 sm:grid-cols-[1fr_1fr_auto]">
          <span className="border-b border-graphite/25 px-6 py-3 sm:border-b-0 sm:border-r">{dict.footer.drawnBy}</span>
          <span className="border-b border-graphite/25 px-6 py-3 sm:border-b-0 sm:border-r">{dict.footer.checkedBy}</span>
          <span className="px-6 py-3">River Portal · {dict.footer.revision} 2026-09</span>
        </div>
      </div>
    </footer>
  );
}
