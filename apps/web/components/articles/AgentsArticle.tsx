import { pickText, type Locale } from '@river/i18n';
import { agentCatalogue } from '@river/psp-agents';
import { effectiveFor } from '@river/psp-runtime';
import { policyValue } from '@river/psp-units';
import { href } from '@/lib/href';
import { lt } from '@/lib/lt';
import { roleText } from '@/lib/roleText';
import { InsightCard } from '../cabinet/InsightCard';
import { SwarmDrawing } from '../river/SwarmDrawing';
import { Icon } from '../ui/Icon';
import { ArticleFrame, Figure, Section, type ArticleWorlds } from './ArticleFrame';

const watch: Record<string, { at: number; bank: 'top' | 'bottom'; dx: number }> = {
  collector: { at: 0, bank: 'bottom', dx: 10 }, sentinel: { at: 2, bank: 'top', dx: -30 }, analyst: { at: 2, bank: 'bottom', dx: 0 }, router: { at: 3, bank: 'top', dx: 40 },
  copilot: { at: 5, bank: 'top', dx: 0 }, reconciler: { at: 7, bank: 'top', dx: -10 }, clerk: { at: 8, bank: 'top', dx: -10 }, treasurer: { at: 7, bank: 'bottom', dx: 30 },
};

/** Article 08 — agents: who watches what in a retail group, the rule they work under, what they did on the stand, and why the demo's agents are deterministic. */
export function AgentsArticle({ locale, worlds }: { locale: Locale; worlds: ArticleWorlds }) {
  const t = lt(locale);
  const w = worlds.retail;
  const enabled = new Set((policyValue(effectiveFor(w, 'rt-group'), 'agents.enabled') as string[] | undefined) ?? agentCatalogue.map((a) => a.id));
  const team = agentCatalogue.filter((a) => enabled.has(a.id));
  const applied = w.insights.find((i) => i.agent === 'router' && i.status === 'applied');
  const claim = w.insights.find((i) => i.agent === 'reconciler' && i.status === 'open' && i.proposal?.kind === 'raise_claim');
  const alert = w.insights.find((i) => i.agent === 'sentinel' && i.consulted.length > 0) ?? w.insights.find((i) => i.agent === 'sentinel');
  const examples = [applied, claim, alert].filter((i) => i !== undefined);
  const byPeople = w.insights.filter((i) => i.status === 'applied' || i.status === 'declined').length;
  const declined = w.insights.filter((i) => i.status === 'declined').length;
  const superseded = w.insights.filter((i) => i.status === 'superseded').length;
  const autonomy = String(policyValue(effectiveFor(w, 'rt-group'), 'agents.autonomy') ?? 'propose');
  const stageNames = [t('source', 'витік'), t('choice', 'вибір'), t('screening', 'перевірка'), t('routing', 'маршрут'), t('consent', 'згода'), t('secured', 'забезпечено'), t('capture', 'списання'), t('distribution', 'розподіл'), t('settlement', 'розрахунок')];
  return (
    <ArticleFrame locale={locale} slug="agents" sheet="RP-08" title={t('Agents: watching and proposing', 'Агенти: спостерігають і пропонують')}
      lead={t('Agents stand along the flow of payments. They read the same views the cabinets show and never move money; they notice what a person would want to know, consult each other and propose what to do. A person accepts or declines; the unit’s policy says which low-risk proposals may be carried out without one; every decision is recorded. In the demo retail group seven agents work — cash forecasting is left to the group’s ERP.', 'Агенти стоять уздовж потоку платежів. Вони читають ті самі проєкції, що й кабінети, і ніколи не рухають гроші; помічають те, що людина хотіла б знати, радяться між собою й пропонують, що робити. Людина приймає чи відхиляє; політика одиниці визначає, які низькоризикові пропозиції можна виконати без людини; кожне рішення записується. У демо-групі працюють сім агентів — прогнозування коштів лишається в ERP групи.')}
      cta={{ label: t('See the agents’ board', 'Подивитися дошку агентів'), path: '/demo' }}>
      <Section index="1" title={t('Who watches what', 'Хто за чим стежить')}>
        <Figure caption={t('Fig. 8.1 — the agents along the flow; the figure in each mark is what waits for a person now.', 'Рис. 8.1 — агенти вздовж потоку; число в кожному знаку — що чекає на людину зараз.')}>
          <SwarmDrawing stages={stageNames} person={t('a person decides', 'вирішує людина')} agents={team.map((a) => ({ id: a.id, name: pickText(a.name, locale), open: w.insights.filter((x) => x.agent === a.id && x.status === 'open').length, ...(watch[a.id] ?? { at: 0, bank: 'top' as const, dx: 0 }) }))} />
        </Figure>
        <ul className="not-prose grid gap-3 sm:grid-cols-2">
          {team.map((a) => (
            <li key={a.id} className="border border-graphite/20 bg-paper p-4">
              <p className="flex items-center gap-2 font-semibold text-ink-900"><Icon name={a.glyph} className="size-4 text-sunrise-600" />{pickText(a.name, locale)}</p>
              <p className="mt-1 text-[0.9rem] text-ink-700">{pickText(a.role, locale)}</p>
              <p className="annot mt-2 text-[0.55rem] text-ink-500">{t('for', 'для')}: {a.audience.map((r) => pickText(roleText('retail', r), locale)).join(' · ')}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section index="2" title={t('The rule: agents propose, people decide, the platform records', 'Правило: агенти пропонують, люди вирішують, платформа записує')}>
        <ul>
          <li>{t('An agent reads views and writes only its own findings. It never writes an event of an order, an invoice, a session, a payment or a settlement.', 'Агент читає проєкції й пише лише власні висновки. Він ніколи не записує подію замовлення, інвойсу, сесії, платежу чи розрахунку.')}</li>
          <li>{t('Every finding carries its evidence — links to the events it rests on — and a confidence. Other agents add what they know: the Analyst adds context to the Sentinel’s alert; the Sentinel says whether a payer behind an overdue invoice shows signs of fraud.', 'Кожен висновок містить докази — посилання на події, на яких він ґрунтується, — і впевненість. Інші агенти додають те, що знають: Аналітик доповнює сповіщення Вартового; Вартовий каже, чи має платник за простроченим інвойсом ознаки шахрайства.')}</li>
          <li>{t('Accepting a proposal needs the right to decide on agents and the right the proposal itself would use: an agent never lends a person a power they do not have. What it then does goes through the same checks a person’s action would.', 'Щоб прийняти пропозицію, потрібне право вирішувати щодо агентів і право, яке використала б сама пропозиція: агент ніколи не позичає людині повноваження, якого вона не має. Те, що відбувається далі, проходить ті самі перевірки, що й дія людини.')}</li>
          <li>{t(`What agents may do alone is a policy of the unit. The demo group sets “${autonomy === 'propose' ? 'propose only' : autonomy}” for all of them. Nothing that touches money or a person’s standing is ever low-risk.`, `Що агенти можуть робити самі — політика одиниці. Демо-група задала для всіх «${autonomy === 'propose' ? 'лише пропонувати' : autonomy}». Ніщо, що зачіпає гроші чи становище людини, не вважається низькоризиковим.`)}</li>
          <li>{t('A finding that describes a standing condition — a cheaper route, a batch’s difference — belongs to a series. When the condition is found again, the newer finding replaces the open one; when it is no longer found, the open one is closed as no longer current.', 'Висновок про стійкий стан — дешевший маршрут, розбіжність пакета — належить до серії. Коли стан виявлено знову, новіший висновок замінює відкритий; коли його більше не виявлено, відкритий закривається як неактуальний.')}</li>
        </ul>
        <p>{t(`On the stand so far: ${byPeople} proposals decided by people (${declined} of them declined), ${superseded} closed as no longer current.`, `На стенді досі: ${byPeople} пропозицій вирішено людьми (з них ${declined} відхилено), ${superseded} закрито як неактуальні.`)}</p>
      </Section>

      <Section index="3" title={t('Findings of the demo', 'Знахідки демо')}>
        <p>{t('The routing change that a person accepted, a claim waiting for the finance controller, an alert of the fraud watch:', 'Зміна маршрутизації, яку прийняла людина, претензія, що чекає на фінансового контролера, сповіщення антифроду:')}</p>
        <div className="not-prose grid gap-3">{examples.map((i) => <InsightCard key={i.id} insight={i} locale={locale} link={(p) => href(locale, `/cabinet${p}`)} back={href(locale, '/platform/agents')} canDecide={false} personName={(id) => pickText(w.people.find((p) => p.id === id)?.name, locale) || id} />)}</div>
      </Section>

      <Section index="4" title={t('Deterministic here, a model there', 'Тут детерміновані, там — модель')}>
        <p>{t('In this demo every agent is a deterministic analyser standing in for a model: the same views always give the same findings, so every claim can be checked against its evidence. A model would take the same place in the same contract — read views, write findings, propose — and would never be called inside the processing of a payment.', 'У цьому демо кожен агент — детермінований аналізатор, що заступає модель: ті самі проєкції завжди дають ті самі висновки, тож кожне твердження можна перевірити доказами. Модель стала б на те саме місце в тому самому контракті — читати проєкції, писати висновки, пропонувати — і ніколи не викликалася б посеред обробки платежу.')}</p>
      </Section>
    </ArticleFrame>
  );
}
