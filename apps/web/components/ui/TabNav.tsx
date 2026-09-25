'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Tabs as links; the longest matching path is the current one. */
export function TabNav({ items, label }: { items: Array<{ href: string; label: string }>; label: string }) {
  const pathname = usePathname();
  const current = [...items].sort((a, b) => b.href.length - a.href.length).find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  return (
    <nav aria-label={label} className="mb-8 flex gap-6 overflow-x-auto border-b border-graphite/25">
      {items.map((item) => (
        <Link key={item.href} href={item.href} aria-current={current?.href === item.href ? 'page' : undefined}
          className={`-mb-px whitespace-nowrap border-b-2 px-1 py-2.5 text-sm font-semibold ${current?.href === item.href ? 'border-sunrise-500 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-900'}`}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
