import Link from 'next/link';
import type { Locale } from '@river/i18n';
import { lt } from '@/lib/lt';
import type { Query } from '@/lib/table';

/**
 * Filters of a list as links (they work without scripts): chip groups that each set one parameter, and a
 * search box that keeps the others. The current choice is underlined.
 */
export function FilterBar({ locale, query, groups, search = true }: { locale: Locale; query: Query; groups: Array<{ param: string; label: string; options: Array<{ value: string; label: string; count?: number }> }>; search?: boolean }) {
  const t = lt(locale);
  const qs = (patch: Query) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...query, ...patch, page: undefined })) if (v) next.set(k, v);
    const s = next.toString();
    return s ? `?${s}` : '?';
  };
  return (
    <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
      {groups.map((g) => (
        <div key={g.param}>
          <p className="annot mb-1.5 text-[0.6rem] text-ink-500">{g.label}</p>
          <div className="flex flex-wrap gap-1">
            <Link href={qs({ [g.param]: undefined })} className={`border px-2 py-1 text-[0.8rem] ${!query[g.param] ? 'border-ink-900 bg-ink-900 text-paper' : 'border-graphite/25 text-ink-700 hover:border-graphite'}`}>{t('All', 'Усі')}</Link>
            {g.options.map((o) => (
              <Link key={o.value} href={qs({ [g.param]: o.value })} className={`border px-2 py-1 text-[0.8rem] ${query[g.param] === o.value ? 'border-ink-900 bg-ink-900 text-paper' : 'border-graphite/25 text-ink-700 hover:border-graphite'}`}>
                {o.label}{o.count !== undefined ? <span className="ml-1.5 font-mono text-[0.7rem] opacity-70">{o.count}</span> : null}
              </Link>
            ))}
          </div>
        </div>
      ))}
      {search ? (
        <form className="ml-auto flex items-center gap-2" role="search">
          {Object.entries(query).filter(([k, v]) => v && k !== 'q' && k !== 'page').map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <input name="q" defaultValue={query.q ?? ''} placeholder={t('Search: id, reference, name', 'Пошук: id, номер, назва')} className="w-64 border border-graphite/30 bg-paper px-3 py-1.5 text-[0.85rem] placeholder:text-ink-300 focus:border-ink-900 focus:outline-none" />
          <button type="submit" className="annot border border-ink-900 px-2.5 py-1.5 text-ink-900 hover:bg-ink-900 hover:text-paper">{t('Find', 'Знайти')}</button>
        </form>
      ) : null}
    </div>
  );
}
