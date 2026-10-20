'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '../ui/Icon';

/** The cabinet's menu: groups of sections; the section whose path is the longest match is current. */
export function CabinetNav({ groups }: { groups: Array<{ label: string | null; items: Array<{ href: string; label: string; icon: string; badge?: number }> }> }) {
  const pathname = usePathname() ?? '';
  const all = groups.flatMap((g) => g.items);
  const current = [...all].sort((a, b) => b.href.length - a.href.length).find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  return (
    <nav aria-label="Cabinet" className="space-y-5">
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.label ? <p className="annot mb-1.5 px-3 text-[0.58rem] text-ink-500">{g.label}</p> : null}
          <ul>
            {g.items.map((item) => {
              const active = current?.href === item.href;
              return (
                <li key={item.href}>
                  <Link href={item.href} aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2.5 border-l-2 px-3 py-1.5 text-[0.88rem] ${active ? 'border-sunrise-500 bg-paper font-semibold text-ink-900' : 'border-transparent text-ink-700 hover:border-graphite/40 hover:text-ink-900'}`}>
                    <Icon name={item.icon} className="size-4 shrink-0 text-ink-500" />
                    <span className="truncate">{item.label}</span>
                    {item.badge ? <span className="ml-auto font-mono text-[0.7rem] text-sunrise-600">{item.badge}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
