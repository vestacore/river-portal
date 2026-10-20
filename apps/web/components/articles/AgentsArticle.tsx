import { pickText, type Locale } from '@river/i18n';
import { agentCatalogue } from '@river/psp-agents';
import { roleLabels } from '@river/psp-access';
import type { World } from '@river/psp-runtime';
import { href } from '@/lib/href';
import { lt } from '@/lib/lt';
import { InsightCard } from '../cabinet/InsightCard';
import { SwarmDrawing } from '../river/SwarmDrawing';
import { Icon } from '../ui/Icon';
import { ArticleFrame, Figure, Section } from './ArticleFrame';

const watch: Record<string, { at: number; bank: 'top' | 'bottom'; dx: number }> = {
  collector: { at: 0, bank: 'bottom', dx: 10 }, sentinel: { at: 2, bank: 'top', dx: -30 }, analyst: { at: 2, bank: 'bottom', dx: 0 }, router: { at: 3, bank: 'top', dx: 40 },
  copilot: { at: 5, bank: 'top', dx: 0 }, reconciler: { at: 7, bank: 'top', dx: -10 }, clerk: { at: 8, bank: 'top', dx: -10 }, treasurer: { at: 7, bank: 'bottom', dx: 30 },
};

/** Article 05 — the agent swarm: who watches what, how they consult, what they may do, and why people decide. */
export function AgentsArticle({ locale, w }: { locale: Locale; w: World }) {
  const t = lt(locale);
  const examples = ['sentinel', 'router', 'collector'].map((a) => w.insights.find((i) => i.agent === a && i.consulted.length > 0) ?? w.insights.find((i) => i.agent === a)).filter((i) => i !== undefined);
  const byPeople = w.insights.filter((i) => i.status === 'applied' || i.status === 'declined').length;
  const byPolicy = w.insights.filter((i) => i.status === 'auto_applied').length;
  const declined = w.insights.filter((i) => i.status === 'declined').length;
  const stageNames = [t('source', 'витік'), t('choice', 'вибір'), t('screening', 'перевірка'), t('routing', 'маршрут'), t('consent', 'згода'), t('secured', 'забезпечено'), t('capture', 'списання'), t('distribution', 'розподіл'), t('after the mouth', 'після гирла')];
  return (
    <ArticleFrame locale={locale} slug="agents" sheet="RP-05" title={t('A swarm that watches, people who decide', 'Рій, що стежить, і люди, що вирішують')}
      lead={t('Eight agents stand along the river. They read the same projections the cabinets show — never a stream of money — notice what a person would want to know, consult each other, and propose what to do. A person accepts or declines; the unit’s policy says which low-risk proposals may be carried out without one; the machine records every decision.', 'Уздовж ріки стоять вісім агентів. Вони читають ті самі проєкції, що й кабінети, — ніколи не потік грошей, — помічають те, що людина хотіла б знати, радяться між собою і пропонують, що робити. Людина приймає чи відхиляє; політика одиниці визначає, які низькоризикові пропозиції можна виконати без людини; машина записує кожне рішення.')}
      cta={{ label: t('See the swarm’s board', 'Подивитися дошку рою'), path: '/demo' }}>
      <Section index="1" title={t('Who watches what', 'Хто за чим стежить')}>
        <Figure caption={t('Fig. 5 — the swarm along the river; the figure in each mark is what waits for a person now.', 'Рис. 5 — рій уздовж ріки; число в кожному знаку — що чекає на людину зараз.')}>
          <SwarmDrawing stages={stageNames} person={t('a person decides', 'вирішує людина')} agents={agentCatalogue.map((a) => ({ id: a.id, name: pickText(a.name, locale), open: w.insights.filter((x) => x.agent === a.id && x.status === 'open').length, ...(watch[a.id] ?? { at: 0, bank: 'top' as const, dx: 0 }) }))} />
        </Figure>
        <ul className="not-prose grid gap-3 sm:grid-cols-2">
          {agentCatalogue.map((a) => (
            <li key={a.id} className="border border-graphite/20 bg-paper p-4">
              <p className="flex items-center gap-2 font-semibold text-ink-900"><Icon name={a.glyph} className="size-4 text-sunrise-600" />{pickText(a.name, locale)}</p>
              <p className="mt-1 text-[0.9rem] text-ink-700">{pickText(a.role, locale)}</p>
              <p className="annot mt-2 text-[0.55rem] text-ink-500">{t('for', 'для')}: {a.audience.map((r) => pickText(roleLabels[r], locale)).join(' · ')}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section index="2" title={t('The rule: agents propose, people decide, the machine records', 'Правило: агенти пропонують, люди вирішують, машина записує')}>
        <ul>
          <li>{t('An agent reads projections and writes only insights, in its own namespace. It never writes a fact of an order, an invoice, a session or a payment.', 'Агент читає проєкції й пише лише висновки у власному просторі імен. Він ніколи не пише факт замовлення, інвойсу, сесії чи платежу.')}</li>
          <li>{t('Every insight carries its evidence — links into the river — and a confidence. Other agents add what they know: the Analyst adds the merchant’s onboarding risk to the Sentinel’s alert; the Sentinel says whether a payer behind an overdue invoice shows signs of fraud.', 'Кожен висновок містить докази — посилання в ріку — і впевненість. Інші агенти додають те, що знають: Аналітик додає до сповіщення Вартового ризик мерчанта з онбордингу; Вартовий каже, чи має платник за простроченим інвойсом ознаки шахрайства.')}</li>
          <li>{t('Accepting a proposal needs the right to decide on agents and the right the proposal itself would use: an agent never lends a person a power they do not have. What it then does goes through the same doors a person would use.', 'Щоб прийняти пропозицію, потрібне право вирішувати щодо агентів і право, яке використала б сама пропозиція: агент ніколи не позичає людині повноваження, якого вона не має. Те, що він робить далі, проходить ті самі двері, що й людина.')}</li>
          <li>{t('What agents may do alone is a policy of the unit. River Pay Ukraine enforces “propose only”; River Pay Europe lets them send reminders and retry webhooks by themselves. Nothing that touches money or a person’s standing is ever low-risk.', 'Що агенти можуть робити самі — політика одиниці. River Pay Україна закріплює «лише пропонувати»; River Pay Європа дозволяє їм самостійно надсилати нагадування й повторювати вебхуки. Ніщо, що зачіпає гроші чи становище людини, ніколи не буває низькоризиковим.')}</li>
        </ul>
        <p>{t(`On the stand so far: ${byPeople} proposals decided by people (${declined} of them declined), ${byPolicy} carried out by a unit’s policy.`, `На стенді досі: ${byPeople} пропозицій вирішено людьми (з них ${declined} відхилено), ${byPolicy} виконано за політикою одиниці.`)}</p>
      </Section>

      <Section index="3" title={t('Real findings of the demo', 'Справжні знахідки демо')}>
        <div className="not-prose grid gap-3">{examples.map((i) => <InsightCard key={i.id} insight={i} locale={locale} link={(p) => href(locale, `/cabinet${p}`)} back={href(locale, '/platform/agents')} canDecide={false} personName={(id) => pickText(w.people.find((p) => p.id === id)?.name, locale) || id} />)}</div>
      </Section>

      <Section index="4" title={t('Deterministic here, a model there', 'Тут детерміновані, там — модель')}>
        <p>{t('In this demo every agent is a deterministic analyser standing in for a model: the same projections always give the same insights, so every claim can be checked against its evidence. A model would take the same place in the same contract — read projections, write insights, propose — and would never be called inside the settling of a payment.', 'У цьому демо кожен агент — детермінований аналізатор, що заступає модель: ті самі проєкції завжди дають ті самі висновки, тож кожне твердження можна перевірити доказами. Модель стала б на те саме місце в тому самому контракті — читати проєкції, писати висновки, пропонувати — і ніколи не викликалася б посеред проведення платежу.')}</p>
      </Section>
    </ArticleFrame>
  );
}
