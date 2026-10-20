import { pickText } from '@river/i18n';
import { agentCatalogue } from '@river/psp-agents';
import { acquirers } from '@river/psp-instruments';
import { approvalByAcquirer } from '@river/psp-views';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { InsightCard } from '@/components/cabinet/InsightCard';
import { HBars } from '@/components/charts/HBars';
import { Panel } from '@/components/panels/Panel';
import { cabinet } from '@/lib/cabinet';
import { percent } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { scoped } from '@/lib/scoped';

/**
 * Where attempts go: the acquirers, banks and lenders of each rail (all stand-ins in this demo), how
 * often each approved in the last 30 days against its nominal rate, the weights the router uses per
 * entity, the rules that route — and the Navigator's proposals.
 */
export default async function Routes({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const c = await cabinet(locale, null, 'policies.write');
  const { t } = c;
  const from = new Date(Date.parse(c.now) - 30 * 86_400_000).toISOString();
  const actual = approvalByAcquirer(scoped(c.w, c.visible).sessions.filter((s) => s.openedAt >= from));
  const routeRules = c.w.rules.filter((r) => r.action === 'route' && c.visible.has(r.unitId));
  const insights = c.w.insights.filter((i) => i.agent === 'router' && c.visible.has(i.unitId));
  const back = c.link('/routes');
  return (
    <>
      <CabinetHead kicker={t('Routing', 'Маршрутизація')} title={t('Routes', 'Маршрути')} lead={t('Every attempt crosses the routing bridge: a unit’s route rule wins; otherwise traffic is shared between the acquirers of the rail by weight, deterministically by session, so a replay routes the same way.', 'Кожна спроба перетинає міст маршрутизації: правило маршруту одиниці має перевагу; інакше трафік ділиться між еквайрами рейки за вагами, детерміновано за сесією, тож повтор маршрутизує так само.')} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel title={t('Approval in the last 30 days', 'Схвалення за останні 30 днів')} note={t('Attempts each one carried that reached an answer.', 'Спроби, які кожен провів і які отримали відповідь.')}>
          <HBars rows={actual.map((a) => ({ label: `${acquirers.find((x) => x.id === a.acquirer)?.name ?? a.acquirer}`, value: a.approvalBps, display: percent(a.approvalBps, locale), note: `${a.approved + a.refused} · ${a.rail}`, tone: a.approvalBps < 9_000 ? 'attention' : 'teal' }))} />
        </Panel>
        <Panel title={t('Weights per entity', 'Ваги за юрособами')} note={t('Set when a person accepts the Navigator’s proposal; until then the best nominal approval leads.', 'Задаються, коли людина приймає пропозицію Штурмана; до того веде найкраще номінальне схвалення.')}>
          {Object.keys(c.w.routeWeights).length === 0 ? <p className="text-ink-500">{t('No weights set: best approval first, 65 / 35.', 'Ваги не задано: спершу найкраще схвалення, 65 / 35.')}</p> : (
            <ul className="space-y-3">{Object.entries(c.w.routeWeights).map(([entity, weights]) => <li key={entity}><p className="font-semibold text-ink-900">{c.unitName(entity)}</p><ul className="mt-1 text-[0.86rem]">{Object.entries(weights).map(([a, wgt]) => <li key={a} className="flex justify-between gap-3"><span className="font-mono">{a}</span><span className="tabular-nums">{wgt} %</span></li>)}</ul></li>)}</ul>
          )}
          {routeRules.length > 0 ? (
            <div className="mt-5 border-t border-graphite/20 pt-3"><p className="annot mb-2 text-[0.58rem] text-ink-500">{t('Rules that route', 'Правила маршруту')}</p><ul className="space-y-1 text-[0.86rem]">{routeRules.map((r) => <li key={r.id}>{pickText(r.name, locale)} <span className="font-mono text-[0.75rem] text-ink-500">→ {r.target} · {c.unitName(r.unitId)}</span></li>)}</ul></div>
          ) : null}
        </Panel>
      </div>
      <Panel title={t('Acquirers, banks and lenders', 'Еквайри, банки та кредитори')} note={t('All stand-ins with invented names: no real institution is contacted.', 'Усі — імітатори з вигаданими назвами: жодну справжню установу не залучено.')} className="mt-6" flush>
        <div className="relative overflow-x-auto">
          <table className="w-full text-left text-[0.86rem]">
            <thead><tr className="border-b border-ink-900/80">{[t('Name', 'Назва'), t('Rails', 'Рейки'), t('Regions', 'Регіони'), t('Nominal approval', 'Номінальне схвалення'), t('Actual, 30 days', 'Фактичне, 30 днів')].map((h) => <th key={h} className="annot px-3 py-2.5 text-[0.58rem] font-normal text-ink-500">{h}</th>)}</tr></thead>
            <tbody>{acquirers.map((a) => { const x = actual.find((r) => r.acquirer === a.id); return <tr key={a.id} className="border-b border-graphite/15"><td className="px-3 py-2"><span className="text-ink-900">{a.name}</span> <span className="font-mono text-[0.7rem] text-ink-500">{a.id}</span></td><td className="px-3 py-2 font-mono text-[0.78rem]">{a.rails.join(', ')}</td><td className="px-3 py-2">{a.regions.join(', ')}</td><td className="px-3 py-2 tabular-nums">{percent(a.approvalBps, locale)}</td><td className="px-3 py-2 tabular-nums">{x ? `${percent(x.approvalBps, locale)} · ${x.approved + x.refused}` : '—'}</td></tr>; })}</tbody>
          </table>
        </div>
      </Panel>
      {insights.length > 0 ? (
        <Panel title={pickText(agentCatalogue.find((a) => a.id === 'router')!.name, locale)} className="mt-6">
          <div className="grid gap-3 lg:grid-cols-2">{insights.map((i) => <InsightCard key={i.id} insight={i} locale={locale} link={c.link} back={back} canDecide={c.may('agents.decide', i.unitId)} personName={c.personName} />)}</div>
        </Panel>
      ) : null}
    </>
  );
}
