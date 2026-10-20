import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Locale } from '@river/i18n';
import type { Column } from '@/components/panels/DataTable';
import { Value } from '@/components/panels/Value';
import { lt } from '@/lib/lt';

/**
 * The kit's table with one more column at the right, for what the cell grammar cannot hold: what a person
 * may do with the row (revoke a key, submit evidence) or a list inside a row (a journal entry's postings).
 * The other columns are the same `Column`s as DataTable's, read through the same cells; sorting and pages
 * are links, so it works without scripts.
 */
export function ActionTable<R>({ columns, rows, locale, query, trailing, total, page = 1, pageSize = 25, empty }: {
  columns: Column<R>[]; rows: R[]; locale: Locale; query: Record<string, string | undefined>;
  trailing: { label: string; render: (row: R) => ReactNode; align?: 'start' | 'end' };
  total?: number; page?: number; pageSize?: number; empty?: ReactNode;
}) {
  const t = lt(locale);
  const qs = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...query, ...patch })) if (v) next.set(k, v);
    const s = next.toString();
    return s ? `?${s}` : '?';
  };
  const count = total ?? rows.length;
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const end = trailing.align === 'end' ? 'text-right' : '';
  return (
    <div className="min-w-0">
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-left text-[0.88rem]">
          <thead>
            <tr className="border-b border-ink-900/80">
              {columns.map((c) => {
                const active = query.sort === c.key;
                const dir = active && query.dir === 'asc' ? 'desc' : 'asc';
                return (
                  <th key={c.key} scope="col" className={`annot whitespace-nowrap px-3 py-2.5 text-[0.62rem] font-normal text-ink-500 ${c.align === 'end' ? 'text-right' : ''}`} style={c.width ? { width: c.width } : undefined}>
                    {c.sort ? <Link href={qs({ sort: c.key, dir, page: undefined })} className={`hover:text-ink-900 ${active ? 'text-ink-900' : ''}`}>{c.label}{active ? (query.dir === 'asc' ? ' ↑' : ' ↓') : ''}</Link> : c.label}
                  </th>
                );
              })}
              <th scope="col" className={`annot whitespace-nowrap px-3 py-2.5 text-[0.62rem] font-normal text-ink-500 ${end}`}>{trailing.label}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="px-3 py-10 text-center text-ink-500">{empty ?? t('Nothing here yet.', 'Тут поки нічого немає.')}</td></tr>
            ) : rows.map((row, i) => (
              <tr key={i} className="border-b border-graphite/15 hover:bg-paper-deep">
                {columns.map((c) => (
                  <td key={c.key} className={`px-3 py-2.5 align-top ${c.align === 'end' ? 'text-right' : ''}`}><Value cell={c.cell(row)} locale={locale} /></td>
                ))}
                <td className={`px-3 py-2 align-top ${end}`}>{trailing.render(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 ? (
        <nav className="annot mt-3 flex items-center justify-between gap-4 text-ink-500" aria-label={t('Pages', 'Сторінки')}>
          <span>{t('Page', 'Сторінка')} {page} / {pages} · {count}</span>
          <span className="flex gap-3">
            {page > 1 ? <Link href={qs({ page: String(page - 1) })} className="hover:text-ink-900">← {t('Previous', 'Попередня')}</Link> : null}
            {page < pages ? <Link href={qs({ page: String(page + 1) })} className="hover:text-ink-900">{t('Next', 'Наступна')} →</Link> : null}
          </span>
        </nav>
      ) : <p className="annot mt-3 text-ink-500">{count} {t('rows', 'рядків')}</p>}
    </div>
  );
}
