import Link from 'next/link';
import { readGifts } from '@river/gifts';
import { formatDate, formatMoney, oblastName, pickText } from '@river/i18n';
import { hasRole } from '@river/identity';
import { findCategory, readNeedQueue } from '@river/needs';
import { getRuntime } from '@river/runtime';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { requireStage } from '@/lib/requireStage';
import { resolveLocale } from '@/lib/resolveLocale';
import { markGiftReceivedAction } from '../actions';
import { StatusBadge } from '../StatusBadge';

const urgencyRank = { today: 0, this_week: 1, this_month: 2, when_possible: 3 } as const;
const settled = new Set(['confirmed', 'closed', 'withdrawn', 'referred']);

/**
 * Inflow: requests arriving on the left bank (active first, by declared urgency and waiting time,
 * never by reputation) and gifts arriving from the right bank.
 */
export default async function InflowPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const { identity } = await requireStage('inflow', locale);
  const dict = getDictionary(locale);
  const t = dict.studio;
  const runtime = await getRuntime();
  const [needs, gifts] = await Promise.all([readNeedQueue(runtime.store, runtime.config.orgId), readGifts(runtime.store, runtime.config.orgId)]);
  const sorted = [...needs].sort((a, b) => Number(settled.has(a.status)) - Number(settled.has(b.status)) || urgencyRank[a.urgency] - urgencyRank[b.urgency] || a.submittedAt.localeCompare(b.submittedAt));
  const canReceive = hasRole(identity, 'coordinator', 'finance_steward', 'administrator');
  return (
    <div className="grid gap-14 xl:grid-cols-[1.5fr_1fr]">
      <section>
        <h2 className="mb-5 text-2xl font-semibold">{t.inflow.needs}</h2>
        <ul className="grid gap-3">
          {sorted.map((n) => (
            <li key={n.id}>
              <Link href={href(locale, `/studio/needs/${n.id}`)} className={`grid gap-3 border-t border-graphite/50 pt-3 transition-colors hover:bg-paper-deep/60 sm:grid-cols-[auto_1fr_auto] sm:items-center ${settled.has(n.status) ? 'opacity-60' : ''}`}>
                <span className="grid size-10 place-items-center bg-river-100 text-river-700"><Icon name={findCategory(n.categoryId)?.icon ?? 'dots'} /></span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <b className="text-ink-900">{pickText(findCategory(n.categoryId)?.label, locale)}</b>
                    <StatusBadge status={n.status} label={dict.statuses[n.status]} />
                    <span className="annot text-sunrise-600">{dict.ask.urgency[n.urgency]}</span>
                  </span>
                  <span className="mt-1 block truncate text-sm text-ink-500">{n.summary}</span>
                </span>
                <span className="text-sm text-ink-500 sm:text-right">
                  <span className="block">{oblastName(n.oblastId, locale)} · {dict.ask.forWhom[n.forWhom]}{n.householdSize ? ` · ${n.householdSize}` : ''}</span>
                  <span className="block">{formatDate(n.submittedAt, locale, true)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-5 text-2xl font-semibold">{t.inflow.gifts}</h2>
        <ul className="grid gap-3">
          {gifts.map((g) => (
            <li key={g.id} className="grid gap-1 border-t border-graphite/50 pt-3">
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <b>{dict.give.kinds[g.kind]}</b>
                {g.amountMinor ? <span className="font-display font-semibold tabular-nums text-ink-900">{formatMoney(g.amountMinor, g.currency ?? 'GBP', locale)}</span> : null}
                <Badge tone={g.status === 'pledged' ? 'sunrise' : 'teal'}>{dict.me.giftStatus[g.status]}</Badge>
                <span className="annot ml-auto text-ink-500">{formatDate(g.pledgedAt, locale)}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-sm text-ink-500">{g.description || g.displayName || '—'}</span>
                {g.status === 'pledged' && canReceive ? (
                  <form action={markGiftReceivedAction}><input type="hidden" name="giftId" value={g.id} /><button className="annot border border-teal-600/50 px-2.5 py-1 text-teal-600 hover:bg-teal-100">✓ {t.inflow.markReceived}</button></form>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
