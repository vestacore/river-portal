import Link from 'next/link';
import { pickText } from '@river/i18n';
import { agentCatalogue, type Insight } from '@river/psp-agents';
import { acquirers } from '@river/psp-instruments';
import { effectiveFor, posOutlook } from '@river/psp-runtime';
import { findPolicyDefinition, policyValue } from '@river/psp-units';
import { approvalByAcquirer } from '@river/psp-views';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { InsightCard } from '@/components/cabinet/InsightCard';
import { PolicyInForce } from '@/components/cabinet/routing/PolicyInForce';
import { PosTable } from '@/components/cabinet/routing/PosTable';
import { SimulationTable } from '@/components/cabinet/routing/SimulationTable';
import { WeeklyRoutingChart } from '@/components/cabinet/routing/WeeklyRoutingChart';
import { HBars } from '@/components/charts/HBars';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { cabinet } from '@/lib/cabinet';
import { count, day, money, percent } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { acquirerName } from '@/lib/routing/acquirerName';
import { bankName } from '@/lib/routing/bankName';
import { countText } from '@/lib/routing/countText';
import { routedTotals } from '@/lib/routing/routedTotals';
import { simulateVisible } from '@/lib/routing/simulateVisible';
import { strategyText } from '@/lib/routing/strategyText';
import { thresholdFloor } from '@/lib/routing/thresholdFloor';
import { weekOf } from '@/lib/routing/weekOf';
import { weeklyRouting } from '@/lib/routing/weeklyRouting';
import { scoped } from '@/lib/scoped';
import { readQuery } from '@/lib/table';

const month = 30 * 86_400_000;
const thresholds = [8_500, 8_800, 9_000, 9_200];

/**
 * The routing studio. The policy in force at the profile's unit — strategy and approval threshold — with
 * who set it, and a form to change it; the last thirty days replayed under every strategy and any
 * threshold; the on-us payments the threshold keeps away; on-us share and effective rate week by week;
 * approval by acquirer; the stores' terminal banks region by region; the Navigator's proposals; the
 * providers. In an assembly without acquiring terms, the weights and rules that route instead.
 */
export default async function Routes({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, null, 'flows.read');
  const { t } = c;
  const back = c.link('/routes');
  const effective = effectiveFor(c.w, c.actor.unitId);
  const strategy = String(policyValue(effective, 'routing.strategy') ?? 'approval_first');
  const threshold = Number(policyValue(effective, 'routing.minApproval.bps') ?? 0);
  const source = effective.find((e) => e.key === 'routing.strategy')?.source ?? null;
  const changed = source ? c.w.settings.find((s) => s.unitId === source && s.key === 'routing.strategy') : undefined;
  const asked = Number(String(query.minApproval ?? '').replace(',', '.'));
  const tried = query.minApproval && Number.isFinite(asked) && asked >= 50 && asked <= 100 ? Math.round(asked * 100) : threshold;
  const from = new Date(Date.parse(c.now) - month).toISOString();
  const priced = c.w.acquiring.length > 0;
  const inForce = simulateVisible(c.w, c.visible, from, threshold);
  const sim = tried === threshold ? inForce : simulateVisible(c.w, c.visible, from, tried);
  const sessions = scoped(c.w, c.visible).sessions;
  const weeks = weeklyRouting(sessions);
  const marker = changed && weeks.some((w) => w.week === weekOf(changed.setAt)) ? { week: weekOf(changed.setAt), label: `${strategyText(String(changed.value), locale).name} · ${day(changed.setAt, locale)}` } : null;
  const before = marker && changed ? routedTotals(sessions, '', changed.setAt) : null;
  const after = marker && changed ? routedTotals(sessions, changed.setAt) : null;
  const actual = approvalByAcquirer(sessions.filter((s) => s.openedAt >= from));
  const pos = priced ? posOutlook(c.w, c.now, 30).filter((p) => c.visible.has(p.regionId)) : [];
  const routeRules = c.w.rules.filter((r) => r.action === 'route' && c.visible.has(r.unitId));
  const weights = Object.entries(c.w.routeWeights).filter(([entity]) => c.visible.has(entity));
  const showWeights = !priced || weights.length > 0 || routeRules.length > 0;
  const router = agentCatalogue.find((a) => a.id === 'router');
  const insights = c.w.insights.filter((i) => i.agent === 'router' && c.visible.has(i.unitId));
  const open = (i: Insight) => i.status === 'open';
  const strategyProposals = insights.filter((i) => open(i) && i.proposal?.kind === 'change_policy' && i.proposal.params.key === 'routing.strategy');
  const approvalProposals = insights.filter((i) => open(i) && i.proposal?.kind === 'negotiate_terms' && i.proposal.params.topic === 'approval');
  const posProposals = insights.filter((i) => open(i) && ((i.proposal?.kind === 'change_policy' && i.proposal.params.key === 'pos.acquirer') || (i.proposal?.kind === 'negotiate_terms' && i.proposal.params.topic === 'on_us')));
  const shown = new Set([...strategyProposals, ...approvalProposals, ...(pos.length > 0 ? posProposals : [])].map((i) => i.id));
  const rest = insights.filter((i) => !shown.has(i.id)).sort((a, b) => Number(!open(a)) - Number(!open(b)) || b.at.localeCompare(a.at)).slice(0, 6);
  const card = (i: Insight) => <InsightCard key={i.id} insight={i} locale={locale} link={c.link} back={back} canDecide={c.may('agents.decide', i.unitId)} personName={c.personName} />;
  const options = [...new Set([...thresholds, threshold, tried])].filter((x) => x > 0).sort((a, b) => a - b);
  const pct = (bps: number) => percent(bps, locale, bps % 100 === 0 ? 0 : 1);
  const letIn = inForce.blockedOnUs.length > 0 ? Math.min(...inForce.blockedOnUs.map((b) => b.approvalBps)) : null;
  const floor = thresholdFloor(c.w, c.actor.unitId);
  const connected = acquirers.filter((a) => c.w.providers.includes(a.id));
  const inForceSim = sim.simulated.find((s) => s.strategy === strategy);
  const lowest = [...sim.simulated].sort((a, b) => a.feeMinor - b.feeMinor || Number(b.strategy === strategy) - Number(a.strategy === strategy))[0];

  const approvalPanel = (
    <Panel key="approval" title={t('Approval in the last 30 days', 'Схвалення за останні 30 днів')} note={t(`Attempts each provider carried that reached an answer, and its nominal rate — the one routing compares with the threshold. Card acquirers below ${pct(threshold)} are marked.`, `Спроби, які провів кожен провайдер і які отримали відповідь, та його номінальний рівень — той, який маршрутизація порівнює з порогом. Карткових еквайрів нижче ${pct(threshold)} позначено.`)}>
      {actual.length === 0 ? <p className="text-ink-500">{t('No attempts in the last 30 days.', 'За останні 30 днів спроб не було.')}</p> : (
        <HBars rows={actual.map((a) => {
          const nominal = acquirers.find((x) => x.id === a.acquirer)?.approvalBps ?? null;
          const below = a.rail === 'card' && nominal !== null && threshold > 0 && nominal < threshold;
          return { label: acquirerName(a.acquirer, locale), value: a.approvalBps, display: percent(a.approvalBps, locale), note: `${count(a.approved + a.refused, locale)} · ${a.rail === 'card' && nominal !== null ? `${t('nominal', 'номін.')} ${percent(nominal, locale)}` : a.rail}`, tone: below ? 'attention' : 'teal' };
        })} />
      )}
    </Panel>
  );
  const weightsPanel = showWeights ? (
    <Panel key="weights" title={t('Weights per entity', 'Ваги за юрособами')} note={t('Set when a person accepts the Navigator’s proposal; until then the best nominal approval leads.', 'Задаються, коли людина приймає пропозицію Штурмана; до того веде найкраще номінальне схвалення.')}>
      {weights.length === 0 ? <p className="text-ink-500">{t('No weights set: best approval first, 65 / 35.', 'Ваги не задано: спершу найкраще схвалення, 65 / 35.')}</p> : (
        <ul className="space-y-3">{weights.map(([entity, w]) => <li key={entity}><p className="font-semibold text-ink-900">{c.unitName(entity)}</p><ul className="mt-1 text-[0.86rem]">{Object.entries(w).map(([a, share]) => <li key={a} className="flex justify-between gap-3"><span>{acquirerName(a, locale)} <span className="font-mono text-[0.7rem] text-ink-500">{a}</span></span><span className="tabular-nums">{share} %</span></li>)}</ul></li>)}</ul>
      )}
      {routeRules.length > 0 ? (
        <div className="mt-5 border-t border-graphite/20 pt-3"><p className="annot mb-2 text-[0.58rem] text-ink-500">{t('Rules that route', 'Правила маршруту')}</p><ul className="space-y-1 text-[0.86rem]">{routeRules.map((r) => <li key={r.id}>{pickText(r.name, locale)} <span className="text-[0.78rem] text-ink-500">→ {r.target ? acquirerName(r.target, locale) : '—'} · {c.unitName(r.unitId)}</span></li>)}</ul></div>
      ) : null}
    </Panel>
  ) : null;
  const blockedPanel = inForce.sessions > 0 ? (
    <Panel key="blocked" title={t('On-us payments the threshold keeps away', 'Платежі on-us, які не пропускає поріг')} note={t(`Last 30 days, at the ${pct(threshold)} threshold in force.`, `Останні 30 днів, за чинного порогу ${pct(threshold)}.`)}>
      <p className="text-[0.88rem] text-ink-700">{t('A payment is on-us when the card was issued by the same bank that accepts it: the bank is on both sides, pays no interchange to another bank, and your terms with it price such cards at a lower on-us rate. Routing never chooses an acquirer whose approval rate is below the threshold, not even to save on fees — so these cards went to another acquirer at the usual price.', 'Платіж on-us — коли картку випустив той самий банк, що її приймає: банк на обох боках, не платить interchange (міжбанківську комісію) іншому банку, а ваші умови з ним мають для таких карток нижчу ставку on-us. Маршрутизація ніколи не обирає еквайра з рівнем схвалення нижче порогу, навіть заради економії, — тож ці картки пішли до іншого еквайра за звичайною ціною.')}</p>
      {inForce.blockedOnUs.length === 0 ? <p className="mt-3 text-[0.88rem] text-ink-500">{t('None: every bank whose cards could go on-us approves at or above the threshold.', 'Таких немає: кожен банк, чиї картки могли б іти on-us, схвалює не нижче порогу.')}</p> : (
        <>
          <div className="relative mt-3 overflow-x-auto">
            <table className="w-full text-left text-[0.86rem]">
              <thead><tr className="border-b border-ink-900/80">{[t('Card bank', 'Банк картки'), t('Its acquirer', 'Його еквайр'), t('Approval rate', 'Рівень схвалення'), t('Payments', 'Платежі'), t('Saving on-us', 'Економія через on-us')].map((h, i) => <th key={h} scope="col" className={`annot px-3 py-2 text-[0.58rem] font-normal text-ink-500 ${i > 1 ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
              <tbody>{inForce.blockedOnUs.map((b) => (
                <tr key={b.acquirer} className="border-b border-graphite/15">
                  <td className="px-3 py-2 text-ink-900">{pickText(b.bankName, locale)}</td>
                  <td className="px-3 py-2 text-ink-700">{pickText(b.acquirerName, locale)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-attention-500">{percent(b.approvalBps, locale)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-ink-900">{count(b.sessions, locale)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-teal-600">{money(b.savingMinor, inForce.currency, locale)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <p className="mt-3 text-[0.82rem] text-ink-500">{t('There are two ways to bring them on-us: the bank raises its approval rate above the threshold, or the threshold comes down and the declines that come with it are accepted.', 'Повернути їх до on-us можна двома способами: банк підвищує рівень схвалення вище порогу, або поріг знижують і погоджуються з відмовами, що прийдуть разом із цим.')}{letIn !== null && letIn < floor ? ` ${t(`Here the threshold cannot go below ${pct(floor)}, so it is the bank’s approval rate that would have to change.`, `Тут поріг не може бути нижчим за ${pct(floor)}, тож змінитися мав би рівень схвалення банку.`)}` : ''}{letIn !== null && letIn !== tried ? <> <Link href={`${back}?minApproval=${letIn / 100}`} className="text-river-700 underline decoration-river-200 underline-offset-2 hover:decoration-river-700">{t(`Replay at ${pct(letIn)}`, `Відтворити за ${pct(letIn)}`)}</Link></> : null}</p>
        </>
      )}
      {approvalProposals.length > 0 ? <div className="mt-4 space-y-3">{approvalProposals.map(card)}</div> : null}
    </Panel>
  ) : null;

  return (
    <>
      <CabinetHead kicker={t('Routing', 'Маршрутизація')} title={t('Routing studio', 'Студія маршрутизації')}
        lead={t('Every online payment attempt is carried by one acquirer. The strategy and the approval threshold below decide which; every decision is recorded in the attempt’s stream with the alternatives it weighed, so any period can be replayed under another policy.', 'Кожну онлайн-спробу оплати проводить один еквайр. Яким саме, вирішують стратегія і поріг схвалення нижче; кожне рішення записано в потоці спроби разом з альтернативами, які зважувались, тож будь-який період можна відтворити за іншої політики.')} />
      <Flash query={query} locale={locale} />

      <Panel title={t(`The policy in force · ${c.unitName(c.actor.unitId)}`, `Чинна політика · ${c.unitName(c.actor.unitId)}`)} note={t('Set on a unit, it applies to every unit below it unless a lower unit sets its own.', 'Задана на одиниці, вона діє для всіх одиниць нижче, якщо нижча одиниця не задала власну.')}>
        <PolicyInForce c={c} locale={locale} back={back} priced={priced} />
      </Panel>

      {sim.sessions > 0 ? (
        <Panel className="mt-6" flush title={t('What the last 30 days would have cost', 'Скільки коштували б останні 30 днів')}
          note={t(`A replay of real decisions under another policy: the same ${countText(sim.sessions, 'en-GB', ['online card attempt', 'online card attempts'], ['', '', ''])}, the same quotes under your acquiring terms, the same deterministic routing — only the strategy and the threshold change. Nothing is sent to the banks.`, `Відтворення справжніх рішень за іншої політики: ті самі онлайн-спроби карткою (${count(sim.sessions, locale)}), ті самі ціни за вашими умовами еквайрингу, та сама детермінована маршрутизація — змінюються лише стратегія і поріг. Банкам нічого не надсилається.`)}
          actions={
            <form className="flex flex-wrap items-center gap-2">
              <label htmlFor="minApproval" className="annot text-[0.6rem] text-ink-500">{t('Approval threshold', 'Поріг схвалення')}</label>
              <select id="minApproval" name="minApproval" defaultValue={String(tried / 100)} className="border border-graphite/30 bg-paper px-2 py-1.5 text-[0.85rem]">
                {options.map((o) => <option key={o} value={String(o / 100)}>{pct(o)}{o === threshold ? ` · ${t('in force', 'чинний')}` : ''}</option>)}
              </select>
              <button type="submit" className="annot border border-ink-900 px-2.5 py-1.5 text-ink-900 hover:bg-ink-900 hover:text-paper">{t('Replay', 'Відтворити')}</button>
            </form>
          }>
          {tried !== threshold ? <p className="border-b border-graphite/20 bg-sunrise-100 px-4 py-2 text-[0.85rem] text-ink-900">{t(`Replayed at a threshold of ${pct(tried)}; the threshold in force is ${pct(threshold)}.`, `Відтворено за порогу ${pct(tried)}; чинний поріг — ${pct(threshold)}.`)}{tried < floor ? ` ${t(`The policy itself cannot go below ${pct(floor)} here: the replay shows what the lower threshold would change, not a setting that would take effect.`, `Сама політика тут не може бути нижчою за ${pct(floor)}: відтворення показує, що змінив би нижчий поріг, а не налаштування, яке набуло б чинності.`)}` : ''} <Link href={back} className="text-river-700 underline decoration-river-200 underline-offset-2">{t('Back to the threshold in force', 'Повернутися до чинного порогу')}</Link></p> : null}
          <div className="px-1"><SimulationTable sim={sim} strategy={strategy} locale={locale} /></div>
          <div className="space-y-1.5 border-t border-graphite/20 px-4 py-3 text-[0.8rem] text-ink-500">
            {inForceSim ? (
              <p className="text-[0.88rem] text-ink-900">
                {lowest && lowest.strategy !== strategy && lowest.feeMinor < inForceSim.feeMinor
                  ? t(`${strategyText(lowest.strategy, locale).name} would have cost ${money(inForceSim.feeMinor - lowest.feeMinor, sim.currency, locale)} less than ${strategyText(strategy, locale).name}, the strategy in force, on the same attempts.`, `«${strategyText(lowest.strategy, locale).name}» коштувала б на ${money(inForceSim.feeMinor - lowest.feeMinor, sim.currency, locale)} менше, ніж чинна стратегія «${strategyText(strategy, locale).name}», на тих самих спробах.`)
                  : t(`${strategyText(strategy, locale).name}, the strategy in force, is the cheapest of the three on these attempts.`, `Чинна стратегія «${strategyText(strategy, locale).name}» — найдешевша з трьох на цих спробах.`)}
                {tried === threshold && changed && changed.setAt > from && sim.actualFeeMinor > inForceSim.feeMinor ? ` ${t(`Part of the period was routed before it took effect on ${day(changed.setAt, locale)}: as routed, the attempts cost ${money(sim.actualFeeMinor - inForceSim.feeMinor, sim.currency, locale)} more.`, `Частину періоду маршрутизовано до того, як вона набула чинності ${day(changed.setAt, locale)}: фактично спроби коштували на ${money(sim.actualFeeMinor - inForceSim.feeMinor, sim.currency, locale)} більше.`)}` : ''}
              </p>
            ) : null}
            <p>{t(`Cost: the expected acquiring fee of each attempt at its amount, under your terms with the acquirer the strategy chooses. Effective rate: that cost divided by the attempts’ card volume, ${money(sim.volumeMinor, sim.currency, locale)}.`, `Вартість: очікувана комісія еквайрингу кожної спроби на її суму, за вашими умовами з еквайром, якого обирає стратегія. Ефективна ставка: ця вартість, поділена на картковий обсяг спроб, ${money(sim.volumeMinor, sim.currency, locale)}.`)}</p>
            <p>{t('Expected change in approval: the approval rates of the acquirers the strategy chooses against those that carried the attempts, in percentage points. A negative figure means more declines.', 'Очікувана зміна схвалення: рівні схвалення еквайрів, яких обирає стратегія, порівняно з тими, що провели спроби, у відсоткових пунктах. Від’ємне значення означає більше відмов.')}</p>
          </div>
          {strategyProposals.length > 0 ? <div className="grid gap-3 border-t border-graphite/20 p-4 lg:grid-cols-2">{strategyProposals.map(card)}</div> : null}
        </Panel>
      ) : null}

      {weeks.length > 1 ? (
        <Panel className="mt-6" title={t('On-us share and effective rate, week by week', 'Частка on-us та ефективна ставка, щотижня')} note={t('Online card attempts over the stand’s history, read from their routing decisions: the share routed on-us, and the expected acquiring fee divided by the amount. The first and the last week may be partial.', 'Онлайн-спроби карткою за всю історію стенда, з їхніх рішень маршрутизації: частка, маршрутизована on-us, і очікувана комісія еквайрингу, поділена на суму. Перший і останній тижні можуть бути неповними.')}>
          <WeeklyRoutingChart weeks={weeks} marker={marker} locale={locale} />
          {before && after && changed && before.sessions > 0 && after.sessions > 0 ? (
            <dl className="mt-4 grid gap-3 border-t border-graphite/20 pt-3 sm:grid-cols-2">
              <div><dt className="annot text-[0.58rem] text-ink-500">{t(`Before ${day(changed.setAt, locale)}`, `До ${day(changed.setAt, locale)}`)}</dt><dd className="mt-1 text-[0.9rem] text-ink-900">{countText(before.sessions, locale, ['attempt', 'attempts'], ['спроба', 'спроби', 'спроб'])} · on-us {percent(before.onUsBps, locale)} · {t('effective rate', 'ефективна ставка')} {percent(before.rateBps, locale, 2)}</dd></div>
              <div><dt className="annot text-[0.58rem] text-ink-500">{t(`Since then · ${strategyText(String(changed.value), locale).name}`, `Відтоді · ${strategyText(String(changed.value), locale).name}`)}</dt><dd className="mt-1 text-[0.9rem] text-ink-900">{countText(after.sessions, locale, ['attempt', 'attempts'], ['спроба', 'спроби', 'спроб'])} · on-us {percent(after.onUsBps, locale)} · {t('effective rate', 'ефективна ставка')} {percent(after.rateBps, locale, 2)}</dd></div>
            </dl>
          ) : null}
        </Panel>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {[blockedPanel, approvalPanel, weightsPanel].filter((p) => p !== null)}
      </div>

      {pos.length > 0 ? (
        <Panel className="mt-6" flush title={t('Store terminals by region', 'Термінали магазинів за регіонами')}
          note={t('Payments at the tills go through the banks’ own terminals: the platform does not carry them. These figures come from the terminal banks’ daily reports for the last 30 days, priced under each bank’s store terms.', 'Платежі на касах проходять через власні термінали банків: платформа їх не проводить. Ці цифри — зі щоденних звітів банків терміналів за останні 30 днів, оцінені за умовами кожного банку для магазинів.')}>
          <div className="px-1"><PosTable rows={pos} c={c} locale={locale} back={back} options={findPolicyDefinition('pos.acquirer').options ?? []} /></div>
          <p className="border-t border-graphite/20 px-4 py-3 text-[0.8rem] text-ink-500">{t('At the other banks: the same cards under the other banks’ store terms, and the difference against the region’s bank. With an on-us clause: the bank’s own cards priced at the on-us rate of its online terms. Changing the terminal bank is a contract and an installation; the platform records the decision and reads the new bank’s reports from then on.', 'В інших банках: ті самі картки за умовами інших банків для магазинів і різниця з банком регіону. З умовою on-us: власні картки банку за ставкою on-us його онлайн-умов. Зміна банку терміналів — це договір і встановлення; платформа фіксує рішення і з того дня читає звіти нового банку.')}</p>
          {posProposals.length > 0 ? <div className="grid gap-3 border-t border-graphite/20 p-4 lg:grid-cols-2">{posProposals.map(card)}</div> : null}
        </Panel>
      ) : null}

      {rest.length > 0 ? (
        <Panel className="mt-6" title={router ? pickText(router.name, locale) : t('Navigator', 'Штурман')} note={router ? pickText(router.role, locale) : undefined}>
          <div className="grid gap-3 lg:grid-cols-2">{rest.map(card)}</div>
        </Panel>
      ) : null}

      <Panel title={t('Acquirers, banks and lenders', 'Еквайри, банки та кредитори')} note={t('The providers this assembly is connected with. All stand-ins with invented names: no real institution is contacted.', 'Провайдери, з якими з’єднана ця збірка. Усі — імітатори з вигаданими назвами: жодну справжню установу не залучено.')} className="mt-6" flush>
        <div className="relative overflow-x-auto">
          <table className="w-full text-left text-[0.86rem]">
            <thead><tr className="border-b border-ink-900/80">{[t('Name', 'Назва'), t('Bank behind it', 'Банк за ним'), t('Rails', 'Рейки'), t('Regions', 'Регіони'), t('Nominal approval', 'Номінальне схвалення'), t('Actual, 30 days', 'Фактичне, 30 днів')].map((h) => <th key={h} scope="col" className="annot px-3 py-2.5 text-[0.58rem] font-normal text-ink-500">{h}</th>)}</tr></thead>
            <tbody>{connected.map((a) => {
              const x = actual.find((r) => r.acquirer === a.id);
              return (
                <tr key={a.id} className="border-b border-graphite/15">
                  <td className="px-3 py-2"><span className="text-ink-900">{pickText(a.label, locale)}</span> <span className="font-mono text-[0.7rem] text-ink-500">{a.id}</span></td>
                  <td className="px-3 py-2 text-ink-700">{bankName(a.id, locale) ?? <span className="text-ink-300">—</span>}</td>
                  <td className="px-3 py-2 font-mono text-[0.78rem]">{a.rails.join(', ')}</td>
                  <td className="px-3 py-2">{a.regions.join(', ')}</td>
                  <td className={`px-3 py-2 tabular-nums ${threshold > 0 && a.approvalBps < threshold && a.rails.includes('card') ? 'text-attention-500' : ''}`}>{percent(a.approvalBps, locale)}</td>
                  <td className="px-3 py-2 tabular-nums">{x ? `${percent(x.approvalBps, locale)} · ${count(x.approved + x.refused, locale)}` : '—'}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
