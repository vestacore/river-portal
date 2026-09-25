import Link from 'next/link';
import { readFeedQueue } from '@river/feed';
import { readFlows } from '@river/flows';
import { readGifts } from '@river/gifts';
import { formatNumber } from '@river/i18n';
import { hasRole } from '@river/identity';
import { readNeedQueue } from '@river/needs';
import { readReports } from '@river/reports';
import { getRuntime } from '@river/runtime';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { requireStage } from '@/lib/requireStage';
import { resolveLocale } from '@/lib/resolveLocale';
import { studioStages, type StageKey } from '@/lib/studioStages';

/** The river today: what waits at each stage, with the stages where this person works marked. */
export default async function StudioBoard({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const { identity } = await requireStage('board', locale);
  const dict = getDictionary(locale);
  const t = dict.studio;
  const runtime = await getRuntime();
  const org = runtime.config.orgId;
  const [needs, gifts, flows, reports, feed] = await Promise.all([
    readNeedQueue(runtime.store, org), readGifts(runtime.store, org), readFlows(runtime.store, org), readReports(runtime.store, org), readFeedQueue(runtime.store, org),
  ]);
  const c = t.board.counts;
  const waiting: Array<[StageKey, Array<[number, string]>]> = [
    ['inflow', [[needs.filter((n) => ['submitted', 'acknowledged', 'triaged', 'open'].includes(n.status)).length, c.needs], [gifts.filter((g) => g.status === 'pledged').length, c.gifts]]],
    ['channels', [[flows.filter((f) => ['forming', 'committed', 'in_motion'].includes(f.status)).length, c.flows]]],
    ['tolls', [[flows.flatMap((f) => f.costs).filter((x) => x.status === 'submitted').length, c.costs]]],
    ['mouth', [[needs.filter((n) => n.status === 'delivered').length, c.mouth]]],
    ['surface', [[reports.filter((r) => r.status === 'draft').length, c.drafts], [feed.filter((i) => i.status === 'suggested').length, c.feed]]],
  ];
  const visible = waiting.flatMap(([key, counts]) => {
    const stage = studioStages.find((s) => s.key === key);
    return stage && hasRole(identity, ...stage.see) ? [{ stage, counts, mine: hasRole(identity, ...stage.act) }] : [];
  });
  return (
    <section>
      <h2 className="text-3xl font-semibold">{t.board.title}</h2>
      <p className="mb-10 mt-2 text-ink-500">{t.lead}</p>
      <ol className="grid border-l border-t border-graphite/30 sm:grid-cols-2 lg:grid-cols-5">
        {visible.map(({ stage, counts, mine }) => (
          <li key={stage.key} className={`border-b border-r border-graphite/30 ${mine ? 'bg-paper' : 'bg-paper-deep/40'}`}>
            <Link href={href(locale, stage.path)} className="group flex h-full flex-col p-5 transition-colors hover:bg-paper-deep">
              <span className="annot flex items-center gap-2 text-ink-500"><Icon name={stage.icon} className="size-3.5" />{t.stages[stage.key].river}</span>
              <span className="mt-1 text-lg font-semibold text-ink-900">{t.stages[stage.key].label}</span>
              <span className="mt-5 space-y-3">
                {counts.map(([n, label]) => (
                  <span key={label} className="block leading-tight">
                    <b className={`font-display text-3xl font-semibold tabular-nums ${n > 0 && mine ? 'text-ink-900' : 'text-ink-500'}`}>{formatNumber(n, locale)}</b>
                    <span className="block text-sm text-ink-500">{label}</span>
                  </span>
                ))}
              </span>
              <span className="mt-auto flex items-center justify-between pt-6">
                {mine ? <span className="annot text-sunrise-600">◆ {t.board.yours}</span> : <span />}
                <Icon name="arrow" className="size-4 text-ink-500 transition group-hover:translate-x-1 group-hover:text-ink-900" />
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-8"><Link className="annot inline-flex items-center gap-2 text-ink-700 underline decoration-graphite/40 underline-offset-4 hover:text-ink-900" href={href(locale)}><Icon name="external" className="size-3.5" />{t.board.viewSite}</Link></p>
    </section>
  );
}
