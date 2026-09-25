import Link from 'next/link';
import { formatDate, oblastName, pickText } from '@river/i18n';
import { findCategory, readNeedQueue } from '@river/needs';
import { getRuntime } from '@river/runtime';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { resolveLocale } from '@/lib/resolveLocale';
import { StatusBadge } from './StatusBadge';

const urgencyRank = { today: 0, this_week: 1, this_month: 2, when_possible: 3 } as const;

/** The needs queue: active first, ordered by declared urgency and waiting time (never reputation). */
export default async function StudioHome({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const t = dict.studio;
  const runtime = await getRuntime();
  const needs = await readNeedQueue(runtime.store, runtime.config.orgId);
  const settled = new Set(['confirmed', 'closed', 'withdrawn', 'referred']);
  const sorted = [...needs].sort((a, b) => Number(settled.has(a.status)) - Number(settled.has(b.status)) || urgencyRank[a.urgency] - urgencyRank[b.urgency] || a.submittedAt.localeCompare(b.submittedAt));
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">{t.queue}</h2>
      <ul className="grid gap-3">
        {sorted.map((n) => (
          <li key={n.id}>
            <Link href={href(locale, `/studio/needs/${n.id}`)} className={`grid gap-2 border-t border-graphite/60 pt-3 transition hover:ring-teal-500 sm:grid-cols-[auto_1fr_auto] sm:items-center ${settled.has(n.status) ? 'opacity-70' : ''}`}>
              <span className="grid size-11 place-items-center rounded-xl bg-river-100 text-river-700"><Icon name={findCategory(n.categoryId)?.icon ?? 'dots'} /></span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <b className="text-ink-900">{pickText(findCategory(n.categoryId)?.label, locale)}</b>
                  <StatusBadge status={n.status} label={dict.statuses[n.status]} />
                  <span className="text-xs font-semibold text-sunrise-600">{dict.ask.urgency[n.urgency]}</span>
                </span>
                <span className="mt-1 block truncate text-sm text-ink-500">{n.summary}</span>
              </span>
              <span className="text-right text-sm text-ink-500">
                <span className="block">{oblastName(n.oblastId, locale)} · {dict.ask.forWhom[n.forWhom]}{n.householdSize ? ` · ${n.householdSize}` : ''}</span>
                <span className="block">{formatDate(n.submittedAt, locale, true)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
