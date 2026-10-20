import { pickText } from '@river/i18n';
import { agentCatalogue, type Insight } from '@river/psp-agents';
import { effectiveFor } from '@river/psp-runtime';
import { policyValue } from '@river/psp-units';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { InsightCard } from '@/components/cabinet/InsightCard';
import { FilterBar } from '@/components/panels/FilterBar';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { SwarmDrawing } from '@/components/river/SwarmDrawing';
import { Icon } from '@/components/ui/Icon';
import { cabinet } from '@/lib/cabinet';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery } from '@/lib/table';

const watch: Record<string, { at: number; bank: 'top' | 'bottom'; dx: number }> = {
  collector: { at: 0, bank: 'bottom', dx: 10 }, sentinel: { at: 2, bank: 'top', dx: -30 }, analyst: { at: 2, bank: 'bottom', dx: 0 }, router: { at: 3, bank: 'top', dx: 40 },
  copilot: { at: 5, bank: 'top', dx: 0 }, reconciler: { at: 7, bank: 'top', dx: -10 }, clerk: { at: 8, bank: 'top', dx: -10 }, treasurer: { at: 7, bank: 'bottom', dx: 30 },
};

/**
 * The swarm's board: what every agent saw in the reach, what it proposes, what people decided — and the
 * rule behind it all, shown as the policy it is: what agents may do alone in this unit.
 */
export default async function Agents({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit);
  const { t } = c;
  const mine = c.w.insights.filter((i) => c.visible.has(i.unitId));
  const shown = mine.filter((i) => (!query.agent || i.agent === query.agent) && (!query.status || i.status === query.status)).sort((a, b) => (a.status === 'open' ? 0 : 1) - (b.status === 'open' ? 0 : 1) || b.at.localeCompare(a.at)).slice(0, 40);
  const autonomy = policyValue(effectiveFor(c.w, c.focus), 'agents.autonomy');
  const statusWords: Record<Insight['status'], [string, string]> = { open: ['waiting', 'чекають'], accepted: ['accepted', 'прийнято'], applied: ['carried out', 'виконано'], declined: ['declined', 'відхилено'], auto_applied: ['by policy', 'за політикою'], superseded: ['superseded', 'замінено'] };
  const stageNames = [t('source', 'витік'), t('choice', 'вибір'), t('screening', 'перевірка'), t('routing', 'маршрут'), t('consent', 'згода'), t('secured', 'забезпечено'), t('capture', 'списання'), t('distribution', 'розподіл'), t('after the mouth', 'після гирла')];
  const back = c.link(`/agents${query.agent ? `?agent=${query.agent}` : ''}`);
  return (
    <>
      <CabinetHead kicker={t('Assistance', 'Допомога')} title={t('The agent swarm', 'Рій агентів')} lead={t('Agents read the same projections you do, write only their own insights, consult each other, and propose. A person decides; the unit’s policy says which low-risk proposals may be carried out alone. Every decision is recorded.', 'Агенти читають ті самі проєкції, що й ви, пишуть лише власні висновки, радяться між собою і пропонують. Вирішує людина; політика одиниці визначає, які низькоризикові пропозиції можна виконати самостійно. Кожне рішення записується.')} />
      <Flash query={query} locale={locale} />
      <Panel title={t('Along the river', 'Уздовж ріки')} note={t('Each agent watches its stretch of the river; the figure in its mark is what waits for a person.', 'Кожен агент стежить за своєю ділянкою ріки; число в знаку — що чекає на людину.')} flush>
        <div className="px-3 py-2"><SwarmDrawing stages={stageNames} person={t('a person decides', 'вирішує людина')} agents={agentCatalogue.map((a) => ({ id: a.id, name: pickText(a.name, locale), open: mine.filter((x) => x.agent === a.id && x.status === 'open').length, ...(watch[a.id] ?? { at: 0, bank: 'top' as const, dx: 0 }) }))} /></div>
      </Panel>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {agentCatalogue.map((a) => {
          const of = mine.filter((x) => x.agent === a.id);
          return (
            <a key={a.id} href={`?agent=${a.id}`} className={`border p-4 ${query.agent === a.id ? 'border-ink-900 bg-paper-deep' : 'border-graphite/25 bg-paper hover:bg-paper-deep'}`}>
              <p className="flex items-center gap-2"><Icon name={a.glyph} className="size-4 text-sunrise-600" /><span className="font-semibold text-ink-900">{pickText(a.name, locale)}</span></p>
              <p className="mt-1 text-[0.8rem] text-ink-500">{pickText(a.role, locale)}</p>
              <p className="annot mt-2 text-[0.55rem] text-ink-700">{(['open', 'applied', 'declined', 'auto_applied'] as const).map((s) => `${t(statusWords[s][0], statusWords[s][1])} ${of.filter((x) => x.status === s).length}`).join(' · ')}</p>
            </a>
          );
        })}
      </div>
      <Panel tone={autonomy === 'propose' ? 'deep' : 'attention'} className="mt-6">
        <p className="flex flex-wrap items-center gap-2 text-[0.9rem]"><Icon name="shield" className="size-4 text-ink-700" />{t('In', 'В одиниці')} <b>{c.unitName(c.focus)}</b> {t('agents may', 'агенти можуть')}: <b>{autonomy === 'propose' ? t('only propose', 'лише пропонувати') : t('carry out low-risk proposals alone (reminders, webhook retries)', 'самостійно виконувати низькоризикові пропозиції (нагадування, повтор вебхуків)')}</b>. <span className="text-ink-500">{t('Policy agents.autonomy — River Pay Ukraine enforces “propose only”; River Pay Europe lets agents act on low-risk proposals.', 'Політика agents.autonomy — River Pay Україна закріплює «лише пропонувати»; River Pay Європа дозволяє агентам діяти за низькоризиковими пропозиціями.')}</span></p>
      </Panel>
      <div className="mt-6">
        <FilterBar locale={locale} query={query} search={false} groups={[
          { param: 'agent', label: t('Agent', 'Агент'), options: agentCatalogue.map((a) => ({ value: a.id, label: pickText(a.name, locale), count: mine.filter((x) => x.agent === a.id).length })) },
          { param: 'status', label: t('Status', 'Статус'), options: (['open', 'applied', 'declined', 'auto_applied'] as const).map((s) => ({ value: s, label: t(statusWords[s][0], statusWords[s][1]), count: mine.filter((x) => x.status === s).length })) },
        ]} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {shown.map((i) => <InsightCard key={i.id} insight={i} locale={locale} link={c.link} back={back} canDecide={c.may('agents.decide', i.unitId)} personName={c.personName} />)}
      </div>
    </>
  );
}
