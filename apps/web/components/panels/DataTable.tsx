import Link from 'next/link';
import type { ReactNode } from 'react';
import { pluralise, type Locale } from '@river/i18n';
import { lt } from '@/lib/lt';
import { Value, type Cell } from './Value';

/**
 * A table panel: columns declared once — a label, how to read a row as a `Cell`, how to sort — and the
 * same table for orders, invoices, sessions, payments, units, alerts, keys or deliveries. Sorting and
 * pages are links, so the table works without scripts; `link` opens a row's own page.
 */
export type Column<R> = { key: string; label: string; cell: (row: R) => Cell; align?: 'start' | 'end'; sort?: (row: R) => string | number; width?: string };

export function DataTable<R>({ columns, rows, locale, link, query, total, page = 1, pageSize = 25, empty, footer }: {
  columns: Column<R>[]; rows: R[]; locale: Locale; link?: (row: R) => string; query: Record<string, string | undefined>; total?: number; page?: number; pageSize?: number; empty?: ReactNode; footer?: ReactNode;
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
              {link ? <th scope="col" className="w-8" aria-hidden="true" /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length + (link ? 1 : 0)} className="px-3 py-10 text-center text-ink-500">{empty ?? t('Nothing here yet.', 'Тут поки нічого немає.')}</td></tr>
            ) : rows.map((row, i) => (
              <tr key={i} className="group border-b border-graphite/15 hover:bg-paper-deep">
                {columns.map((c) => (
                  <td key={c.key} className={`px-3 py-2.5 align-top ${c.align === 'end' ? 'text-right' : ''}`}><Value cell={c.cell(row)} locale={locale} /></td>
                ))}
                {link ? <td className="px-2 py-2.5 text-right align-top"><Link href={link(row)} className="annot text-ink-300 group-hover:text-ink-900" aria-label={t('Open', 'Відкрити')}>→</Link></td> : null}
              </tr>
            ))}
          </tbody>
          {footer ? <tfoot><tr className="border-t border-ink-900/80"><td colSpan={columns.length + (link ? 1 : 0)} className="px-3 py-2.5">{footer}</td></tr></tfoot> : null}
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
      ) : <p className="annot mt-3 text-ink-500">{pluralise(count, locale, locale === 'uk' ? { one: '{n} рядок', few: '{n} рядки', many: '{n} рядків', other: '{n} рядка' } : { one: '{n} row', other: '{n} rows' })}</p>}
    </div>
  );
}
