import Link from 'next/link';
import { pickText, type Locale } from '@river/i18n';
import { agentCatalogue } from '@river/psp-agents';
import { effectiveFor, reconcileSettlements } from '@river/psp-runtime';
import { policyValue } from '@river/psp-units';
import { approvalByAcquirer } from '@river/psp-views';
import type { cabinet } from '@/lib/cabinet';
import { count, money, percent, when } from '@/lib/format';
import { acceptanceCosts, type CostLine } from '@/lib/routing/acceptanceCosts';
import { countText } from '@/lib/routing/countText';
import { rateBps } from '@/lib/routing/rateBps';
import { simulateVisible } from '@/lib/routing/simulateVisible';
import { storeCosts } from '@/lib/routing/storeCosts';
import { strategyText } from '@/lib/routing/strategyText';
import { weeklyRouting } from '@/lib/routing/weeklyRouting';
import { scoped } from '@/lib/scoped';
import type { Query } from '@/lib/table';
import { HBars } from '../../charts/HBars';
import { Metric } from '../../panels/Metric';
import { Panel } from '../../panels/Panel';
import { InsightCard } from '../InsightCard';

const month = 30 * 86_400_000;

/**
 * The overview of the payments manager: online card payments of the last thirty days and what they cost —
 * the effective rate against the thirty days before, the on-us share, the approval rate — what the
 * cheapest routing strategy would have saved on the same attempts, the cost of acceptance across rails and
 * the stores' terminals, and the Navigator's open proposals. Within the profile's reach.
 */
export function PaymentsManagerOverview({ c, locale, query }: { c: Awaited<ReturnType<typeof cabinet>>; locale: Locale; query: Query }) {
  const { t } = c;
  const back = c.link(query.unit ? `?unit=${query.unit}` : '');
  const now = Date.parse(c.now);
  const from = new Date(now - month).toISOString();
  const earlier = new Date(now - 2 * month).toISOString();
  const costs = acceptanceCosts(c.w, c.visible, from, c.now);
  const prior = acceptanceCosts(c.w, c.visible, earlier, from);
  const direct = costs.feeKind === 'acquirer';
  const main = [...costs.card].sort((a, b) => b.count - a.count)[0];
  const currency = main?.currency ?? 'UAH';
  const before = prior.card.find((l) => l.currency === currency);
  const rateNow = main ? rateBps(main.feeMinor, main.grossMinor) : 0;
  const rateBefore = before ? rateBps(before.feeMinor, before.grossMinor) : null;
  const effective = effectiveFor(c.w, c.actor.unitId);
  const strategy = String(policyValue(effective, 'routing.strategy') ?? 'approval_first');
  const threshold = Number(policyValue(effective, 'routing.minApproval.bps') ?? 0);
  const source = effective.find((e) => e.key === 'routing.strategy')?.source ?? null;
  const setting = source ? c.w.settings.find((s) => s.unitId === source && s.key === 'routing.strategy') : undefined;
  const sim = simulateVisible(c.w, c.visible, from, threshold);
  const best = [...sim.simulated].sort((a, b) => a.feeMinor - b.feeMinor || Number(b.strategy === strategy) - Number(a.strategy === strategy))[0];
  const current = sim.simulated.find((s) => s.strategy === strategy);
  const saving = best && current ? Math.max(0, current.feeMinor - best.feeMinor) : 0;
  const kept = sim.blockedOnUs.reduce((s, b) => s + b.savingMinor, 0);
  const sessions = scoped(c.w, c.visible).sessions;
  const weeks = weeklyRouting(sessions).slice(-8);
  const answered = approvalByAcquirer(sessions.filter((s) => s.openedAt >= from && s.route?.rail === 'card'));
  const approved = answered.reduce((s, a) => s + a.approved, 0);
  const asked = answered.reduce((s, a) => s + a.approved + a.refused, 0);
  const approvalBps = asked > 0 ? Math.round((approved / asked) * 10_000) : 0;
  const stores = storeCosts(c.w, c.visible, from.slice(0, 10));
  const storeGross = stores.reduce((s, l) => s + l.grossMinor, 0);
  const storeFee = stores.reduce((s, l) => s + l.feeMinor, 0);
  const rails = costs.rails.filter((l) => l.currency === currency);
  const differences = direct && c.w.views.settlements.size > 0 ? reconcileSettlements(c.w, c.now).filter((r) => r.reconciliation.status === 'fee_difference' && (r.view.storeId ? c.visible.has(r.view.storeId) : c.visible.has(r.view.merchantId))) : [];
  const above = differences.reduce((s, r) => s + r.reconciliation.differences.filter((d) => d.kind === 'fee').reduce((x, d) => x + d.deltaMinor, 0), 0);
  const router = agentCatalogue.find((a) => a.id === 'router');
  const insights = c.w.insights.filter((i) => i.agent === 'router' && c.visible.has(i.unitId) && i.status === 'open').sort((a, b) => b.at.localeCompare(a.at));
  const m = (minor: number, compact = false) => money(minor, currency, locale, compact);
  const pct = (bps: number) => percent(bps, locale, bps % 100 === 0 ? 0 : 1);
  const more = (path: string, label: string) => <Link href={c.link(path)} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{label} →</Link>;
  const line = (label: string, value: string, note?: string, href?: string) => (
    <li className="flex items-baseline justify-between gap-3 py-2">
      <span className="min-w-0 text-ink-700">{href ? <Link href={href} className="underline decoration-graphite/30 underline-offset-2 hover:decoration-sunrise-500">{label}</Link> : label}{note ? <span className="block text-[0.78rem] text-ink-500">{note}</span> : null}</span>
      <span className="whitespace-nowrap tabular-nums text-ink-900">{value}</span>
    </li>
  );
  const sum = (lines: CostLine[], key: 'count' | 'grossMinor' | 'feeMinor') => lines.reduce((s, l) => s + l[key], 0);
  const name = (s: string) => strategyText(s, locale).name;
  const attempts = countText(sim.sessions, locale, ['online card attempt', 'online card attempts'], ['онлайн-спроба карткою', 'онлайн-спроби карткою', 'онлайн-спроб карткою']);
  const blockedPayments = countText(sim.blockedOnUs.reduce((s, b) => s + b.sessions, 0), locale, ['payment', 'payments'], ['платіж', 'платежі', 'платежів']);
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Metric label={t('Online card payments, 30 days', 'Онлайн-платежі карткою, 30 днів')} value={count(main?.count ?? 0, locale)} note={t(`${m(main?.grossMinor ?? 0, true)} captured`, `списано ${m(main?.grossMinor ?? 0, true)}`)} href={c.link('/costs')} />
        <Metric label={direct ? t('Effective rate, online cards', 'Ефективна ставка, онлайн-картки') : t('PSP fee rate, cards', 'Ставка комісії PSP, картки')} value={percent(rateNow, locale, 2)}
          tone={rateBefore === null ? undefined : rateNow < rateBefore ? 'success' : rateNow > rateBefore ? 'warning' : undefined}
          note={rateBefore === null ? t('no payments in the 30 days before', 'у попередні 30 днів платежів не було') : t(`${percent(rateBefore, locale, 2)} in the 30 days before`, `${percent(rateBefore, locale, 2)} у попередні 30 днів`)}
          {...(direct && weeks.length > 1 ? { spark: weeks.map((w) => w.rateBps) } : {})} href={c.link('/costs')} />
        {sim.sessions > 0 ? (
          <>
            <Metric label={t('On-us share', 'Частка on-us')} value={percent(sim.actualOnUsShareBps, locale)} note={t('of online card attempts, as routed', 'онлайн-спроб карткою, як маршрутизовано')} {...(weeks.length > 1 ? { spark: weeks.map((w) => w.onUsBps) } : {})} href={c.link('/routes')} />
            <Metric label={t('Approval rate, cards', 'Рівень схвалення, картки')} value={percent(approvalBps, locale)} note={t(`${count(approved, locale)} of ${count(asked, locale)} answered attempts`, `${count(approved, locale)} з ${count(asked, locale)} спроб із відповіддю`)} href={c.link('/routes')} />
            <Metric label={t('Saving the cheapest strategy would add', 'Економія, яку дала б найдешевша стратегія')} value={m(saving)} tone={saving > 0 ? 'warning' : 'success'}
              note={saving > 0 && best ? t(`${name(best.strategy)} instead of ${name(strategy)}, on the last 30 days`, `«${name(best.strategy)}» замість «${name(strategy)}», на останніх 30 днях`) : t(`${name(strategy)} is the cheapest at the ${pct(threshold)} threshold${kept > 0 ? `; ${m(kept)} more is kept away by it` : ''}`, `«${name(strategy)}» — найдешевша за порогу ${pct(threshold)}${kept > 0 ? `; ще ${m(kept)} не пропускає сам поріг` : ''}`)} href={c.link('/routes')} />
          </>
        ) : (
          <Metric label={t('Approval rate, cards', 'Рівень схвалення, картки')} value={percent(approvalBps, locale)} note={t(`${count(approved, locale)} of ${count(asked, locale)} answered attempts`, `${count(approved, locale)} з ${count(asked, locale)} спроб із відповіддю`)} href={c.link('/routes')} />
        )}
        <Metric label={t('Open proposals on routing', 'Відкриті пропозиції щодо маршрутизації')} value={count(insights.length, locale)} tone={insights.length > 0 ? 'warning' : 'success'} note={router ? t(`from the ${pickText(router.name, locale)}`, `від агента «${pickText(router.name, locale)}»`) : undefined} href={c.link('/routes')} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title={t('Routing', 'Маршрутизація')} actions={more('/routes', t('The routing studio', 'Студія маршрутизації'))}
          note={setting ? t(`${name(strategy)}, threshold ${pct(threshold)} · set by ${c.personName(setting.setBy)}, ${when(setting.setAt, locale)}`, `«${name(strategy)}», поріг ${pct(threshold)} · задав(ла) ${c.personName(setting.setBy)}, ${when(setting.setAt, locale)}`) : t(`${name(strategy)}, threshold ${pct(threshold)} · the default`, `«${name(strategy)}», поріг ${pct(threshold)} · типове значення`)}>
          {sim.sessions > 0 ? (
            <>
              <p className="mb-3 text-[0.85rem] text-ink-500">{t(`The last 30 days replayed: ${attempts} under each strategy, with the same quotes under your terms.`, `Останні 30 днів у відтворенні: ${attempts} за кожною стратегією, з тими самими цінами за вашими умовами.`)}</p>
              <HBars rows={[
                { label: t('As routed', 'Як маршрутизовано'), value: sim.actualFeeMinor, display: m(sim.actualFeeMinor), note: percent(rateBps(sim.actualFeeMinor, sim.volumeMinor), locale, 2), tone: 'ink' as const },
                ...sim.simulated.map((s) => ({ label: name(s.strategy), value: s.feeMinor, display: m(s.feeMinor), note: percent(rateBps(s.feeMinor, sim.volumeMinor), locale, 2), tone: (s.feeMinor === best?.feeMinor ? 'teal' : 'river') as 'teal' | 'river' })),
              ]} />
              {sim.blockedOnUs.length > 0 ? <p className="mt-3 text-[0.82rem] text-ink-500">{t(`The ${pct(threshold)} threshold keeps ${blockedPayments} away from on-us: their banks’ acquirers approve below it.`, `Поріг ${pct(threshold)} не пропускає до on-us ${blockedPayments}: еквайри їхніх банків схвалюють нижче нього.`)}</p> : null}
            </>
          ) : <p className="text-ink-500">{direct ? t('No online card attempts within your reach in the last 30 days.', 'За останні 30 днів у ваших межах не було онлайн-спроб карткою.') : t('No online card attempts priced under acquiring terms within your reach: approval first decides, and there is no cost to replay.', 'У ваших межах немає онлайн-спроб карткою, оцінених за умовами еквайрингу: вирішує «Спершу схвалення», і відтворювати за вартістю нічого.')}</p>}
        </Panel>
        <Panel title={t('Cost of acceptance, 30 days', 'Собівартість приймання, 30 днів')} actions={more('/costs', t('Costs', 'Витрати'))}>
          <ul className="divide-y divide-graphite/15 text-[0.88rem]">
            {main ? line(direct ? t('Online cards: acquiring fee', 'Онлайн-картки: комісія еквайрингу') : t('Cards: PSP fee', 'Картки: комісія PSP'), m(main.feeMinor), t(`effective rate ${percent(rateNow, locale, 2)}`, `ефективна ставка ${percent(rateNow, locale, 2)}`)) : null}
            {rails.length > 0 ? line(t('Other rails', 'Інші рейки'), m(sum(rails, 'feeMinor')), `${countText(sum(rails, 'count'), locale, ['payment', 'payments'], ['платіж', 'платежі', 'платежів'])}, ${m(sum(rails, 'grossMinor'), true)}`) : null}
            {stores.length > 0 ? line(t('Store cards, from the banks’ reports', 'Картки в магазинах, зі звітів банків'), m(storeFee, true), t(`${m(storeGross, true)} turnover · effective rate ${percent(rateBps(storeFee, storeGross), locale, 2)}`, `оборот ${m(storeGross, true)} · ефективна ставка ${percent(rateBps(storeFee, storeGross), locale, 2)}`)) : null}
            {direct ? line(t('Billed above the terms', 'Нараховано понад умови'), m(above), countText(differences.length, locale, ['batch with a fee difference', 'batches with a fee difference'], ['пакет із різницею в комісії', 'пакети з різницею в комісії', 'пакетів із різницею в комісії']), c.link('/settlements?status=fee_difference')) : null}
          </ul>
          {direct ? <p className="mt-3 text-[0.8rem] text-ink-500">{t('The banks settle to the group’s accounts directly; the platform holds no money and takes no percentage. Store payments go through the banks’ own terminals: the platform reads their reports.', 'Банки розраховуються напряму з рахунками групи; платформа коштів не тримає й відсотка не бере. Платежі в магазинах проходять через власні термінали банків: платформа читає їхні звіти.')}</p> : null}
        </Panel>
      </div>

      <Panel title={router ? pickText(router.name, locale) : t('Navigator', 'Штурман')} note={t('Open proposals on routing and terms within your reach. The agent proposes; you decide.', 'Відкриті пропозиції щодо маршрутизації та умов у ваших межах. Агент пропонує — вирішуєте ви.')} actions={more('/routes', t('In the routing studio', 'У студії маршрутизації'))}>
        {insights.length === 0 ? <p className="text-ink-500">{direct ? t('Nothing open: the routing in force is the cheapest the replay finds, and no terminal bank or clause is worth raising.', 'Нічого відкритого: чинна маршрутизація — найдешевша з того, що знаходить відтворення, і жоден банк терміналів чи пункт договору не варто піднімати.') : t('Nothing open on routing.', 'Відкритих пропозицій щодо маршрутизації немає.')}</p> : (
          <div className="grid gap-3 lg:grid-cols-2">{insights.slice(0, 4).map((i) => <InsightCard key={i.id} insight={i} locale={locale} link={c.link} back={back} canDecide={c.may('agents.decide', i.unitId)} personName={c.personName} />)}</div>
        )}
      </Panel>
    </div>
  );
}
