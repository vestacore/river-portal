'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Switches locale while staying on the same page; remembers the choice in a cookie. */
export function LanguageSwitcher({ current, label }: { current: string; label: string }) {
  const pathname = usePathname() ?? '/';
  const swap = (segment: string) => pathname.replace(/^\/(en-gb|uk)(?=\/|$)/, `/${segment}`);
  const remember = (segment: string) => { document.cookie = `river-locale=${segment}; path=/; max-age=31536000; samesite=lax`; };
  return (
    <nav aria-label={label} className="annot flex items-center gap-1.5">
      {[['en-gb', 'EN'], ['uk', 'УКР']].map(([segment, text], i) => (
        <span key={segment} className="flex items-center gap-1.5">
          {i > 0 ? <span className="text-ink-300" aria-hidden="true">/</span> : null}
          <Link href={swap(segment as string)} onClick={() => remember(segment as string)} hrefLang={segment} aria-current={current === segment ? 'true' : undefined}
            className={`px-1 py-1 transition-colors ${current === segment ? 'text-ink-900 underline decoration-sunrise-500 decoration-2 underline-offset-[5px]' : 'text-ink-500 hover:text-ink-900'}`}>{text}</Link>
        </span>
      ))}
    </nav>
  );
}
