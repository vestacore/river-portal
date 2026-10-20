import Link from 'next/link';
import { pickText, type Locale } from '@river/i18n';
import { alertKindLabels, alertKinds, riskReasonLabels, type AlertStatus } from '@river/psp-risk';
import type { SessionView } from '@river/psp-session';
import type { cabinet } from '@/lib/cabinet';
import { count, percent } from '@/lib/format';
import type { Query } from '@/lib/table';
import { HBars } from '../../charts/HBars';
import { DataTable, type Column } from '../../panels/DataTable';
import { Metric } from '../../panels/Metric';
import { Panel } from '../../panels/Panel';
import type { Cell } from '../../panels/Value';
import { heldAt } from '../compliance/held';
import { scoreTone } from '../compliance/tones';
import { InsightCard } from '../InsightCard';

const day = 86_400_000;
const stillOpen: ReadonlySet<AlertStatus> = new Set(['new', 'investigating', 'escalated']);

type Held = { s: SessionView; at: string };

/**
 * The overview of the Compliance cabinet: what waits for the officer — held attempts, new alerts, cases
 * under investigation, onboarding — then how the last thirty days scored and why, the alerts by kind, the
 * newest holds, and what the Sentinel and the Analyst propose.
 */
export function ComplianceOverview({ c, locale, query }: { c: Awaited<ReturnType<typeof cabinet>>; locale: Locale; query: Query }) {
  const { t, w } = c;
  const from = new Date(Date.parse(c.now) - 30 * day).toISOString();
  const back = c.link(`${query.unit ? `?unit=${query.unit}` : ''}`);
  const sessions = [...w.views.sessions.values()].filter((s) => c.visible.has(s.unitId));
  const held: Held[] = sessions.filter((s) => s.outcome === 'review').map((s) => ({ s, at: heldAt(w, s) })).sort((a, b) => b.at.localeCompare(a.at));
  const alerts = w.alerts.filter((a) => c.visible.has(a.unitId));
  const fresh = alerts.filter((a) => a.status === 'new').length;
  const investigating = alerts.filter((a) => a.status === 'investigating').length;
  const escalated = alerts.filter((a) => a.status === 'escalated').length;
  const reported = alerts.filter((a) => a.kind === 'threshold' && a.status === 'reported' && a.updatedAt >= from).length;
  const cases = w.onboarding.filter((k) => c.visible.has(k.unitId) && (k.status === 'open' || k.status === 'more_info'));
  const scored = sessions.flatMap((s) => (s.risk && s.openedAt >= from ? [s.risk] : []));
  const buckets = [0, 20, 40, 60, 80].map((lo) => ({ lo, hi: lo === 80 ? 100 : lo + 19, n: scored.filter((r) => r.score >= lo && (lo === 80 || r.score < lo + 20)).length }));
  const share = (n: number) => { const bps = scored.length ? Math.round((n / scored.length) * 10_000) : 0; return n > 0 && bps < 50 ? `< ${percent(100, locale, 0)}` : percent(bps, locale, 0); };
  const reasons = [...scored.flatMap((r) => r.reasons).reduce((m, r) => m.set(r, (m.get(r) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const reasonText = (r: string) => pickText(riskReasonLabels[r as keyof typeof riskReasonLabels], locale) || r;
  const kinds = alertKinds.map((k) => ({ k, all: alerts.filter((a) => a.kind === k).length, open: alerts.filter((a) => a.kind === k && stillOpen.has(a.status)).length })).filter((x) => x.all > 0);
  const insights = w.insights.filter((i) => (i.agent === 'sentinel' || i.agent === 'analyst') && c.visible.has(i.unitId))
    .sort((a, b) => Number(b.status === 'open') - Number(a.status === 'open') || b.at.localeCompare(a.at)).slice(0, 6);
  const why = (s: SessionView): Cell => {
    if (!s.review) return { kind: 'text', value: t('The money does not match', 'Кошти не збігаються') };
    const [first, ...rest] = s.risk?.reasons ?? [];
    return first ? { kind: 'text', value: reasonText(first), sub: rest.length ? t(`and ${rest.length} more`, `і ще ${rest.length}`) : undefined } : { kind: 'empty' };
  };
  const heldColumns: Column<Held>[] = [
    { key: 'session', label: t('Session', 'Сесія'), cell: ({ s }) => ({ kind: 'mono', value: s.sessionId, href: c.link(`/sessions/${s.sessionId}`) }) },
    { key: 'held', label: t('Held', 'Затримано'), cell: ({ at }) => ({ kind: 'ago', iso: at, now: c.now }) },
    { key: 'unit', label: t('Unit', 'Одиниця'), cell: ({ s }) => ({ kind: 'unit', name: c.unitName(s.unitId) }) },
    { key: 'amount', label: t('Amount', 'Сума'), align: 'end', cell: ({ s }) => ({ kind: 'money', minor: s.amountMinor, currency: s.currency }) },
    { key: 'risk', label: t('Risk', 'Ризик'), align: 'end', cell: ({ s }) => (s.risk ? { kind: 'bar', share: s.risk.score / 100, label: String(s.risk.score), tone: scoreTone(s.risk.score) } : { kind: 'empty' }) },
    { key: 'why', label: t('Why', 'Чому'), cell: ({ s }) => why(s) },
  ];
  const newest = held.slice(0, 6);
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Metric label={t('Held attempts', 'Затримані спроби')} value={count(held.length, locale)} note={held.length ? t('wait for a decision', 'чекають на рішення') : t('nothing waits', 'нічого не чекає')} tone={held.length ? 'warning' : undefined} href={c.link('/reviews')} />
        <Metric label={t('New alerts', 'Нові сповіщення')} value={count(fresh, locale)} note={t(`of ${count(alerts.length, locale)} within reach`, `із ${count(alerts.length, locale)} у ваших межах`)} tone={fresh ? 'warning' : undefined} href={c.link('/alerts?status=new')} />
        <Metric label={t('Investigating · escalated', 'Розслідуються · ескальовано')} value={`${count(investigating, locale)} · ${count(escalated, locale)}`} note={t('cases being worked on', 'справи в роботі')} href={c.link('/alerts?status=investigating')} />
        <Metric label={t('Threshold reports, 30 days', 'Порогові звіти, 30 днів')} value={count(reported, locale)} note={t('threshold alerts reported', 'порогових операцій повідомлено')} href={c.link('/alerts?kind=threshold')} />
        <Metric label={t('Onboarding cases open', 'Відкриті справи онбордингу')} value={count(cases.length, locale)} note={t(`${cases.filter((k) => k.status === 'more_info').length} waiting for the merchant`, `чекають на мерчанта: ${cases.filter((k) => k.status === 'more_info').length}`)} href={c.link('/onboarding')} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title={t('Newest held attempts', 'Найновіші затримані спроби')} flush actions={<Link href={c.link('/reviews')} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('Decide them', 'Вирішити')} →</Link>}>
          <div className="px-1"><DataTable columns={heldColumns} rows={newest} total={newest.length} locale={locale} query={{}} link={({ s }) => c.link(`/sessions/${s.sessionId}`)} empty={t('Nothing is held. The river runs.', 'Нічого не затримано. Ріка тече.')} /></div>
        </Panel>
        <Panel title={t('Risk scores, 30 days', 'Бали ризику, 30 днів')} note={t(`${count(scored.length, locale)} attempts screened. Medium from 40, high from 70; where a unit holds or blocks is its policy.`, `Перевірено спроб: ${count(scored.length, locale)}. Середній рівень від 40, високий від 70; де одиниця затримує чи блокує — визначає її політика.`)}>
          <HBars rows={buckets.map((b) => ({ label: `${b.lo}–${b.hi}`, value: b.n, display: count(b.n, locale), note: share(b.n), tone: b.lo >= 80 ? 'attention' : b.lo >= 40 ? 'sunrise' : 'teal' }))} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={t('Why attempts scored, 30 days', 'Чому спроби отримали бали, 30 днів')} note={t('How often each reason was seen among the screened attempts.', 'Як часто кожна причина траплялася серед перевірених спроб.')}>
          {reasons.length === 0 ? <p className="text-ink-500">{t('No reasons were seen.', 'Причин не помічено.')}</p> : (
            <HBars rows={reasons.map(([r, n]) => ({ label: reasonText(r), value: n, display: count(n, locale), note: share(n), tone: 'sunrise' }))} />
          )}
        </Panel>
        <Panel title={t('Alerts by kind', 'Сповіщення за видом')} note={t('All alerts within reach; the note says how many are still open.', 'Усі сповіщення у ваших межах; примітка — скільки ще відкрито.')} actions={<Link href={c.link('/alerts')} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('All alerts', 'Усі сповіщення')} →</Link>}>
          {kinds.length === 0 ? <p className="text-ink-500">{t('No alerts.', 'Сповіщень немає.')}</p> : (
            <HBars rows={kinds.map((x) => ({ label: pickText(alertKindLabels[x.k], locale), value: x.all, display: count(x.all, locale), note: x.open ? t(`${x.open} open`, `відкрито: ${x.open}`) : undefined, tone: x.open ? 'attention' : 'river' }))} />
          )}
        </Panel>
      </div>

      <Panel title={t('The Sentinel and the Analyst', 'Вартовий і Аналітик')} note={t('What they saw within reach, open proposals first. They propose; you decide.', 'Що вони побачили у ваших межах, спершу відкриті пропозиції. Вони пропонують — вирішуєте ви.')} actions={<Link href={c.link('/agents')} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('All proposals', 'Усі пропозиції')} →</Link>}>
        {insights.length === 0 ? <p className="text-ink-500">{t('Nothing to report.', 'Нічого не помічено.')}</p> : (
          <div className="grid gap-3 xl:grid-cols-2">{insights.map((i) => <InsightCard key={i.id} insight={i} locale={locale} link={c.link} back={back} canDecide={c.may('agents.decide', i.unitId)} personName={c.personName} />)}</div>
        )}
      </Panel>
    </div>
  );
}
