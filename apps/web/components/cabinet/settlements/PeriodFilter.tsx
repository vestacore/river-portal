import Link from 'next/link';
import type { Locale } from '@river/i18n';
import { lt } from '@/lib/lt';
import type { Query } from '@/lib/table';

/** The periods a settlement list offers, in days of business; the longest is the whole history of the stand. */
export const periods = [7, 30, 75] as const;
export type Period = (typeof periods)[number];

/** The period a query asks for: 7 or 30 days, or by default the whole 75 days. */
export const periodOf = (query: Query): Period => (query.days === '7' ? 7 : query.days === '30' ? 30 : 75);

/**
 * The period of a list as links, drawn like a group of the filter bar: it keeps every other parameter of
 * the query and starts the list again from its first page. The current choice is filled.
 */
export function PeriodFilter({ locale, query }: { locale: Locale; query: Query }) {
  const t = lt(locale);
  const current = periodOf(query);
  const qs = (days: Period) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...query, days: days === 75 ? undefined : String(days), page: undefined, done: undefined, error: undefined })) if (v) next.set(k, v);
    const s = next.toString();
    return s ? `?${s}` : '?';
  };
  return (
    <div className="mb-4">
      <p className="annot mb-1.5 text-[0.6rem] text-ink-500">{t('Business days', 'Операційні дні')}</p>
      <div className="flex flex-wrap gap-1">
        {periods.map((d) => (
          <Link key={d} href={qs(d)} className={`border px-2 py-1 text-[0.8rem] ${current === d ? 'border-ink-900 bg-ink-900 text-paper' : 'border-graphite/25 text-ink-700 hover:border-graphite'}`}>
            {t(`${d} days`, `${d} днів`)}
          </Link>
        ))}
      </div>
    </div>
  );
}
