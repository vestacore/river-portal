'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Item = { path: string; href: string; label: string; river: string };

/**
 * The stages of the river as the studio's navigation: working label over the river's name, in equal
 * columns on wide screens (seven fit at 1024 px and up) and a scrolling strip on narrow ones.
 */
export function StageNav({ items, label }: { items: Item[]; label: string }) {
  const pathname = usePathname();
  const current = [...items].sort((a, b) => b.href.length - a.href.length).find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  return (
    <nav aria-label={label} className="mb-10 overflow-x-auto border-y border-graphite/30">
      <ol className="flex min-w-max lg:grid lg:min-w-0" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item, i) => {
          const active = current?.href === item.href;
          return (
            <li key={item.path} className="border-r border-graphite/20 last:border-r-0">
              <Link href={item.href} aria-current={active ? 'page' : undefined}
                className={`flex h-full items-start gap-2.5 px-3.5 py-3 transition-colors ${active ? 'bg-ink-900 text-paper' : 'text-ink-700 hover:bg-paper-deep'}`}>
                <span className={`pt-0.5 font-mono text-xs ${active ? 'text-sunrise-300' : 'text-ink-300'}`}>{String(i).padStart(2, '0')}</span>
                <span className="min-w-0 leading-tight">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className={`annot block text-[0.62rem] ${active ? 'text-ink-300' : 'text-ink-500'}`}>{item.river}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
