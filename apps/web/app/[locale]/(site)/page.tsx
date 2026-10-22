import Link from 'next/link';
import { pickText } from '@river/i18n';
import { agentCatalogue } from '@river/psp-agents';
import { stageCatalogue, stages } from '@river/psp-facts';
import { instrumentCatalogue } from '@river/psp-instruments';
import { effectiveFor, posOutlook, retailStand, simulateRouting } from '@river/psp-runtime';
import { policyValue } from '@river/psp-units';
import { BasinDrawing, type BasinMark } from '@/components/river/BasinDrawing';
import { OnUsFigure } from '@/components/river/OnUsFigure';
import { PaymentRiver, type RiverStream } from '@/components/river/PaymentRiver';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { capturedSince, formsOfStage, sinceDays, stageCounts } from '@/lib/figures';
import { count, day, money, percent } from '@/lib/format';
import { href } from '@/lib/href';
import { instrumentIcon } from '@/lib/instrumentIcon';
import { lt } from '@/lib/lt';
import { resolveLocale } from '@/lib/resolveLocale';
import { roleText } from '@/lib/roleText';
import { cardCostSince, groupFlows, reconciliationSince, routingWeeks, strategyChange } from '@/lib/routingFigures';
import { treeLayout } from '@/lib/treeLayout';
import { world } from '@/lib/world';

export const dynamic = 'force-dynamic';

/**
 * The home of the platform: a description for the people who run payments in a large company, drawn
 * on the drafting table. Every figure on it is live — read from the retail group's demo stand — so the
 * page is also the first view of the demo.
 */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const t = lt(locale);
  const w = world('retail');
  const psp = world('psp');
  const now = new Date().toISOString();
  const from = sinceDays(30);
  const paid = capturedSince(w, from);
  const online = paid.filter((p) => p.merchantId === 'rt-online');
  const sessions = [...w.views.sessions.values()].filter((s) => s.openedAt >= from);
  const secured = sessions.filter((s) => s.paymentId !== null).length;
  const refused = sessions.filter((s) => s.paymentId === null && s.outcome === 'failed').length;
  const cost = cardCostSince(w, from);
  const recon = reconciliationSince(w, now, 30);
  const openProposals = w.insights.filter((i) => i.status === 'open').length;

  // Routing: what the change of strategy did, the replay, the tills.
  const change = strategyChange(w);
  const weeks = routingWeeks(w);
  const before = change ? weeks.filter((x) => x.week < change.setAt.slice(0, 10)) : [];
  const after = change ? weeks.filter((x) => x.week > change.setAt.slice(0, 10)) : [];
  const avg = (rows: typeof weeks, key: 'onUsBps' | 'rateBps') => (rows.length ? Math.round(rows.reduce((s, x) => s + x[key], 0) / rows.length) : 0);
  const minApproval = Number(policyValue(effectiveFor(w, 'rt-group'), 'routing.minApproval.bps') ?? 9_000);
  const sim = simulateRouting(w, { from, minApprovalBps: minApproval });
  const approvalFirst = sim.simulated.find((s) => s.strategy === 'approval_first');
  const pos = posOutlook(w, now, 30);
  const tillVolume = pos.reduce((s, p) => s + p.volumeMinor, 0);
  const tillFee = pos.reduce((s, p) => s + p.feeMinor, 0);
  const clauseSaving = pos.reduce((s, p) => s + (p.ifOnUsClauseFeeMinor !== null ? p.feeMinor - p.ifOnUsClauseFeeMinor : 0), 0);
  const changedBy = change ? pickText(w.people.find((p) => p.id === change.setBy)?.name, locale) : '';

  // The life of a payment, drawn as the river.
  const counts = stageCounts(w, from);
  const riverStages = stages.slice(1, 8).map((stage) => ({ label: pickText(stageCatalogue.find((s) => s.stage === stage)!.label, locale), forms: formsOfStage(stage), count: count(counts[stage], locale) }));
  let net = 0;
  let fees = 0;
  let points = 0;
  for (const p of paid) for (const a of p.allocations) {
    if (a.role === 'acquirer_fee') fees += a.amountMinor;
    else if (p.instrument === 'bonus_points') points += a.amountMinor;
    else net += a.amountMinor;
  }
  const streamOf = (label: string, minor: number, tone: RiverStream['tone']): RiverStream => ({ label, share: minor, amount: money(minor, 'UAH', locale, true), tone });
  const riverStreams = [streamOf(t('Credited to the group', 'Зараховано групі'), net, 'merchant'), streamOf(t('Paid with bonus points', 'Сплачено балами'), points, 'charity'), streamOf(t('Acquirers’ fees', 'Комісії еквайрів'), fees, 'fee')];

  // The structure of the group.
  const flows = groupFlows(w, from);
  const tree = treeLayout(w.units, 'rt-group', (u) => u.kind !== 'store' || u.channel !== 'pos', 1400, 92);
  const treeHeight = 40 + Math.max(...tree.map((n) => n.depth)) * 92 + 84;
  const shortName = (name: string) => (name.length > 18 ? `${name.slice(0, 17)}…` : name);
  const marks: Record<string, BasinMark> = Object.fromEntries(w.units.map((u) => [u.id, {
    unitId: u.id, flow: flows[u.id] ?? 0, enforced: w.settings.filter((s) => s.unitId === u.id && s.mode === 'enforced').length, set: w.settings.filter((s) => s.unitId === u.id).length,
    blocked: u.blockInheritance, onboarding: u.status === 'onboarding', label: shortName(pickText(u.name, locale)), sub: money(flows[u.id] ?? 0, 'UAH', locale, true),
  }]));

  const allowed = new Set((policyValue(effectiveFor(w, 'rt-group'), 'instruments.allowed') as string[] | undefined) ?? []);
  const byInstrument = new Map<string, number>();
  for (const p of paid) byInstrument.set(p.instrument, (byInstrument.get(p.instrument) ?? 0) + 1);
  const enabled = new Set((policyValue(effectiveFor(w, 'rt-group'), 'agents.enabled') as string[] | undefined) ?? []);

  const tiles: Array<[string, string]> = [
    [t('Online payments, 30 days', 'Онлайн-платежів за 30 днів'), count(online.length, locale)],
    [t('Paid online', 'Сплачено онлайн'), money(online.reduce((s, p) => s + p.capturedMinor, 0), 'UAH', locale, true)],
    [t('Approved', 'Схвалено'), percent(secured + refused ? Math.round((secured / (secured + refused)) * 10_000) : 0, locale)],
    [t('On-us card payments', 'Карткових платежів on-us'), percent(cost.onUsBps, locale, 0)],
    [t('Effective acquiring rate', 'Ефективна ставка еквайрингу'), percent(cost.rateBps, locale, 2)],
    [t('Settlement batches matched', 'Пакетів розрахунку звірено'), percent(recon.batches ? Math.round((recon.matched / recon.batches) * 10_000) : 0, locale)],
  ];

  const articles = [
    { icon: 'route', path: '/platform/routing', title: t('Routing and cost', 'Маршрутизація і собівартість'), text: t('Which bank carries each online payment, by approval and by cost under the group’s agreements; on-us; what the tills’ reports show.', 'Який банк проводить кожен онлайн-платіж — за схваленням і вартістю за договорами групи; on-us; що показують звіти кас.') },
    { icon: 'scales', path: '/platform/reconciliation', title: t('Settlement reconciliation', 'Звірка розрахунків'), text: t('Sales, the bank’s report and the credit to the account, compared for every bank and store; fees checked against the agreements.', 'Продажі, звіт банку й зарахування на рахунок — для кожного банку й магазину; комісії перевіряються за договорами.') },
    { icon: 'bridge', path: '/platform/lifecycle', title: t('The life of a payment', 'Життя платежу'), text: t('From the order to the settlement: five boundaries, each with its own events and views; capture after picking.', 'Від замовлення до розрахунку: п’ять меж, у кожної власні події й проєкції; списання після комплектації.') },
    { icon: 'layers', path: '/platform/instruments', title: t('Payment instruments', 'Платіжні інструменти'), text: t('Cards and wallets, pay by bank, NBU QR and instant transfers, bank transfers, instalments, bonus points: their courses and capabilities.', 'Картки й гаманці, оплата з банку, QR НБУ й миттєві перекази, банківські перекази, оплата частинами, бонусні бали: їхні русла й можливості.') },
    { icon: 'tree', path: '/platform/hierarchy', title: t('Structure and policies', 'Структура і політики'), text: t('The group as a tree of units: policies apply downwards, flows are visible upwards, access is delegated.', 'Група як дерево одиниць: політики діють донизу, потоки видно догори, доступ делегується.') },
    { icon: 'invoice', path: '/platform/invoicing', title: t('Orders and invoices', 'Замовлення та інвойси'), text: t('Orders from the order system, invoices adjusted after picking, corporate invoices on terms, reminders, the whole story of an order.', 'Замовлення із системи замовлень, інвойси після комплектації, корпоративні інвойси з умовами оплати, нагадування, уся історія замовлення.') },
    { icon: 'split', path: '/platform/split', title: t('Distribution of a payment', 'Розподіл платежу'), text: t('The shares of each payment: the group’s net and the bank’s fee; points and card in one order; a marketplace’s sellers.', 'Частки кожного платежу: сума для групи й комісія банку; бали й картка в одному замовленні; продавці маркетплейсу.') },
    { icon: 'bot', path: '/platform/agents', title: t('Agents', 'Агенти'), text: t('Agents that read the same views as people, consult each other and propose; people decide; every decision is recorded.', 'Агенти, що читають ті самі проєкції, що й люди, радяться між собою й пропонують; вирішують люди; кожне рішення записується.') },
  ];

  const assemblies: Array<[string, string, string, string, string, string]> = [
    ['Who holds the money', 'Хто тримає кошти', 'The group: banks settle to its own accounts', 'Група: банки розраховуються з її рахунками', 'The provider, on behalf of its merchants', 'Провайдер — від імені мерчантів'],
    ['What the platform charges for', 'За що платить клієнт', 'The platform itself; no percentage of payments', 'За саму платформу; без відсотка від платежів', 'A fee per payment, by tariff', 'Комісія за платіж за тарифом'],
    ['After the capture', 'Після списання', 'Settlement by each bank, reconciled three ways', 'Розрахунок кожного банку, трибічна звірка', 'Payouts to merchants and sellers', 'Виплати мерчантам і продавцям'],
    ['Onboarding and AML', 'Онбординг і AML', 'Not needed: the group accepts for itself', 'Не потрібні: група приймає для себе', 'Merchants are onboarded and monitored', 'Онбординг і моніторинг мерчантів'],
  ];

  return (
    <>
      <section className="paper-grid relative overflow-hidden border-b border-graphite/15 pb-14 pt-12 sm:pt-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-end">
            <div className="animate-rise">
              <p className="annot mb-7 flex items-center gap-3 text-ink-500"><span className="text-sunrise-600">{t('Payment flow orchestration', 'Оркестрація платіжних потоків')} · {t('demo stand', 'демо-стенд')}</span><span className="h-px w-16 bg-graphite/40" aria-hidden="true" /></p>
              <h1 className="text-balance text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900 sm:text-[3.4rem]">{t('Payment flow orchestration', 'Оркестрація платіжних потоків')}<span className="mt-3 block text-[1.45rem] font-medium leading-snug tracking-[-0.01em] text-ink-500 sm:text-[1.9rem]">{t('for companies with acquiring agreements of their own', 'для компаній із власними договорами еквайрингу')}</span></h1>
              <p className="mt-6 max-w-2xl text-lg text-ink-700 sm:text-xl">{t('River connects a company’s own systems — orders, the bonus programme, accounting — with payment instruments and the banks it has agreements with. It routes every online payment by approval and cost, captures after picking, reconciles each bank’s settlement with sales and passes the result to accounting. Tills and accounting systems stay where they are.', 'River з’єднує власні системи компанії — замовлення, бонусну програму, облік — із платіжними інструментами та банками, з якими в неї є договори. Платформа маршрутизує кожен онлайн-платіж за схваленням і вартістю, списує кошти після комплектації, звіряє розрахунки кожного банку з продажами й передає результат в облік. Каси й облікові системи лишаються на своїх місцях.')}</p>
            </div>
            <div className="animate-rise lg:pb-2">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <Button href={href(locale, '/demo')} size="lg"><Icon name="layers" />{t('Open a cabinet', 'Відкрити кабінет')}</Button>
                <Button href={href(locale, '/shop')} size="lg" variant="secondary"><Icon name="card" />{t('Pay a demo order', 'Сплатити демо-замовлення')}</Button>
              </div>
              <ul className="annot mt-7 grid gap-2 text-ink-500">
                {[t('Banks settle to the company’s own accounts', 'Банки розраховуються з рахунками компанії'), t('Every figure is derived from the event log', 'Кожна цифра виведена з журналу подій'), t('Agents propose, people decide', 'Агенти пропонують, рішення ухвалюють люди')].map((item) => (
                  <li key={item} className="flex items-center gap-2"><Icon name="check" className="size-3.5 text-teal-600" />{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <figure className="mt-12">
            <OnUsFigure w={w} locale={locale} />
            <figcaption className="mt-4 grid gap-4 border-t border-graphite/25 pt-4 lg:grid-cols-[1.4fr_1fr_1fr]">
              <p className="annot flex items-start gap-3 text-ink-500"><span className="mt-2 h-px w-8 shrink-0 bg-graphite/40" aria-hidden="true" />{t('Fig. 1 — one online card payment and its route, live: the stand’s own terms price it at each acquirer, and the platform’s routing function chooses under the group’s strategy and threshold as they are set now.', 'Рис. 1 — один онлайн-платіж карткою і його маршрут, наживо: власні умови стенда оцінюють його в кожного еквайра, а функція маршрутизації платформи обирає за стратегією й порогом групи, як їх задано зараз.')}</p>
              {change && change.value !== 'approval_first' ? (
                <>
                  <p className="text-[0.92rem] text-ink-700"><span className="annot block text-[0.6rem] text-ink-500">{t('On-us share, online cards', 'Частка on-us, онлайн-картки')}</span><b className="text-xl tabular-nums text-ink-900">{percent(avg(before, 'onUsBps'), locale, 0)} → {percent(avg(after, 'onUsBps'), locale, 0)}</b><span className="annot block text-[0.58rem] text-ink-500">{t('weekly average, before and after', 'середнє за тиждень, до і після')} {day(change.setAt, locale)}</span></p>
                  <p className="text-[0.92rem] text-ink-700"><span className="annot block text-[0.6rem] text-ink-500">{t('Effective rate, online cards', 'Ефективна ставка, онлайн-картки')}</span><b className="text-xl tabular-nums text-ink-900">{percent(avg(before, 'rateBps'), locale, 2)} → {percent(avg(after, 'rateBps'), locale, 2)}</b><span className="annot block text-[0.58rem] text-ink-500">{t('after the strategy changed to on-us first', 'після зміни стратегії на «спершу on-us»')}</span></p>
                </>
              ) : null}
            </figcaption>
          </figure>
        </Container>
      </section>

      <section className="border-b border-graphite/15 bg-paper-deep">
        <Container>
          <div className="grid grid-cols-2 gap-px bg-graphite/15 sm:grid-cols-3 lg:grid-cols-6">
            {tiles.map(([label, value]) => (
              <div key={label} className="bg-paper-deep px-4 py-6">
                <p className="annot text-ink-500">{label}</p>
                <p className="mt-2 text-xl font-semibold tabular-nums text-ink-900">{value}</p>
              </div>
            ))}
          </div>
          <p className="annot py-3 text-[0.6rem] text-ink-500">{t('The demo stand of an invented retail group, 30 days. Banks and figures are simulated.', 'Демо-стенд вигаданої роздрібної групи, 30 днів. Банки й цифри змодельовано.')}</p>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <SectionHeading index="01" title={t('Routing and the cost of acceptance', 'Маршрутизація і собівартість приймання платежів')} lead={t('A group that accepts cards through several banks pays each under its own agreement. The same payment costs different amounts depending on which bank carries it, and most of the difference comes from one question: was the card issued by the bank that accepts it.', 'Група, що приймає картки через кілька банків, платить кожному за власним договором. Той самий платіж коштує по-різному залежно від того, який банк його проводить, і більша частина різниці залежить від одного: чи випустив картку той самий банк, що її приймає.')} />
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-5 text-[1.02rem] text-ink-700">
              <p>{t('The fee for a card payment has three parts: interchange to the card’s bank, the payment system’s fees, and the acquirer’s markup. A payment is on-us when the issuing bank and the acquiring bank are the same: no interchange passes to another bank, and an agreement with an on-us clause prices it well below the usual rate.', 'Комісія за картковий платіж має три частини: interchange банку картки, збори платіжної системи й маржа еквайра. Платіж є on-us, коли банк-емітент і банк-еквайр — той самий банк: interchange іншому банку не передається, а договір з умовою on-us оцінює такий платіж значно нижче за звичайну ставку.')}</p>
              <p>{t('For every online card payment the platform reads the issuing bank from the card’s first digits, quotes each acquirer under the group’s agreement and applies the group’s strategy — approval first, least cost or on-us first — with an approval threshold below which no bank is chosen to save on fees. The decision is recorded with every alternative, so any payment can be explained and any policy can be replayed on real history.', 'Для кожного онлайн-платежу карткою платформа визначає банк-емітент за першими цифрами картки, розраховує комісію кожного еквайра за договором групи й застосовує стратегію групи — спершу схвалення, найменша вартість чи спершу on-us — з порогом схвалення, нижче якого жоден банк не обирається заради меншої комісії. Рішення записується з усіма альтернативами, тож будь-який платіж можна пояснити, а будь-яку політику — відтворити на справжній історії.')}</p>
              {change && change.value !== 'approval_first' ? <p>{t(`In the demo group the strategy changed on ${day(change.setAt, locale)}: ${changedBy} accepted the Navigator agent’s proposal of on-us first. The on-us share of online card payments went from ${percent(avg(before, 'onUsBps'), locale, 0)} to ${percent(avg(after, 'onUsBps'), locale, 0)}, and the effective rate from ${percent(avg(before, 'rateBps'), locale, 2)} to ${percent(avg(after, 'rateBps'), locale, 2)}.`, `У демо-групі стратегію змінено ${day(change.setAt, locale)}: ${changedBy} прийняв пропозицію агента «Штурман» — спершу on-us. Частка on-us серед онлайн-платежів картками зросла з ${percent(avg(before, 'onUsBps'), locale, 0)} до ${percent(avg(after, 'onUsBps'), locale, 0)}, а ефективна ставка знизилася з ${percent(avg(before, 'rateBps'), locale, 2)} до ${percent(avg(after, 'rateBps'), locale, 2)}.`)}</p> : null}
              <p>{t('The tills are outside routing: store payments go through the terminals of each region’s bank. Their settlement reports still show whose cards the customers carry, and that is the basis for the commercial work — an on-us clause, IC++ instead of a blended rate, the choice of a terminal bank.', 'Каси поза маршрутизацією: платежі в магазинах проходять через термінали банку кожного регіону. Проте звіти банків показують, чиї картки мають покупці, і це основа для комерційної роботи — умова on-us, IC++ замість єдиної ставки, вибір банку терміналів.')}</p>
              <div className="flex flex-wrap gap-4 pt-2"><Button href={href(locale, '/platform/routing')} variant="secondary" size="sm">{t('Routing and cost, in detail', 'Маршрутизація і собівартість докладно')}<Icon name="arrow" className="size-4" /></Button></div>
            </div>
            <div className="grid content-start gap-px bg-graphite/20">
              {[
                [t('Online card payments, 30 days', 'Онлайн-платежі картками, 30 днів'), `${count(sim.sessions, locale)} · ${money(cost.grossMinor, 'UAH', locale, true)}`, t('as routed', 'як маршрутизовано')],
                [t('Acquiring fees as routed', 'Комісії еквайрів, як маршрутизовано'), money(sim.actualFeeMinor, sim.currency, locale), `${t('on-us', 'on-us')} ${percent(sim.actualOnUsShareBps, locale, 0)}`],
                [t('The same payments by approval first', 'Ті самі платежі за схваленням'), approvalFirst ? money(approvalFirst.feeMinor, sim.currency, locale) : '—', t('replay of the same sessions', 'відтворення тих самих сесій')],
                [t('Store card turnover, 30 days', 'Картковий оборот магазинів, 30 днів'), money(tillVolume, 'UAH', locale, true), `${t('fees', 'комісії')} ${money(tillFee, 'UAH', locale, true)} · ${percent(tillVolume ? Math.round((tillFee / tillVolume) * 10_000) : 0, locale, 2)}`],
                [t('An on-us clause at the tills would save', 'Умова on-us на касах заощадила б'), money(clauseSaving, 'UAH', locale, true), t('30 days, from the banks’ reports', '30 днів, за звітами банків')],
              ].map(([label, value, note]) => (
                <div key={label} className="bg-paper px-5 py-4">
                  <p className="annot text-ink-500">{label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-ink-900">{value}</p>
                  <p className="annot mt-1 text-[0.58rem] text-ink-500">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-graphite/15 bg-paper-deep py-24">
        <Container>
          <SectionHeading index="02" title={t('Settlement reconciliation', 'Звірка розрахунків')} lead={t('Every bank reports what it settled and credits the money to the group’s account. The platform compares three records of each day — the group’s sales, the bank’s report, the credit — for every bank and every store, and passes the result to accounting.', 'Кожен банк звітує, що він розрахував, і зараховує гроші на рахунок групи. Платформа порівнює три записи кожного дня — продажі групи, звіт банку, зарахування — для кожного банку й кожного магазину та передає результат в облік.')} />
          <div className="grid gap-px bg-graphite/20 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [t('Batches, 30 days', 'Пакетів за 30 днів'), count(recon.batches, locale), `${recon.providers} ${t('providers', 'провайдерів')} · ${recon.stores} ${t('stores', 'магазинів')}`],
              [t('Matched', 'Звірено'), count(recon.matched, locale), percent(recon.batches ? Math.round((recon.matched / recon.batches) * 10_000) : 0, locale)],
              [t('Need a person', 'Потребують людини'), count(recon.open, locale), [...recon.byStatus.values()].reduce((s, x) => s + x.count, 0) ? t('fees, reports, credits', 'комісії, звіти, зарахування') : '—'],
              [t('In question', 'Під питанням'), money([...recon.byStatus.values()].reduce((s, x) => s + x.deltaMinor, 0), 'UAH', locale), t('sum of the differences', 'сума розбіжностей')],
            ].map(([label, value, note]) => (
              <div key={label} className="bg-paper-deep px-5 py-5">
                <p className="annot text-ink-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-ink-900">{value}</p>
                <p className="annot mt-1 text-[0.58rem] text-ink-500">{note}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl text-[1.02rem] text-ink-700">{t('Fees are checked against the agreements line by line: the bank’s report breaks each day down by issuing bank and card product, and the platform prices every line the way it prices a payment for routing. A difference is closed by a person’s decision — accepted, a claim raised, written off — and stays in the batch’s history. Cash planning stays in the group’s ERP.', 'Комісії перевіряються за договорами рядок за рядком: звіт банку розбиває кожен день за банками-емітентами й типами карток, і платформа оцінює кожен рядок так само, як оцінює платіж для маршрутизації. Розбіжність закривається рішенням людини — прийнято, подано претензію, списано — і лишається в історії пакета. Планування коштів лишається в ERP групи.')}</p>
          <div className="mt-6"><Button href={href(locale, '/platform/reconciliation')} variant="secondary" size="sm">{t('How reconciliation works', 'Як працює звірка')}<Icon name="arrow" className="size-4" /></Button></div>
        </Container>
      </section>

      <section className="border-t border-graphite/15 py-24">
        <Container>
          <SectionHeading index="03" title={t('Connected, not replaced', 'Під’єднано, а не замінено')} lead={t('The platform works between the company’s systems and its payment providers. Each system keeps its role; the platform exchanges events with it.', 'Платформа працює між системами компанії та її платіжними провайдерами. Кожна система зберігає свою роль; платформа обмінюється з нею подіями.')} />
          <ul className="grid gap-px bg-graphite/20 sm:grid-cols-2 lg:grid-cols-4">
            {([
              ['invoice', t('Order system', 'Система замовлень'), t('Creates orders and invoices through the API, reports picking and delivery; receives every payment event. Capture follows picking: weighed goods, missing items, substitutes.', 'Створює замовлення й інвойси через API, повідомляє про комплектацію й доставку; отримує кожну подію оплати. Списання йде за комплектацією: ваговий товар, відсутні позиції, заміни.')],
              ['sparkle', t('Bonus system', 'Бонусна система'), t('Keeps its rules and balances. The pay page shows the balance; points are reserved, redeemed as part of an order and returned on a refund.', 'Зберігає свої правила й баланси. Сторінка оплати показує баланс; бали резервуються, списуються як частина замовлення й повертаються при поверненні.')],
              ['scales', t('Accounting (ERP)', 'Облік (ERP)'), t('Receives reconciled settlement batches and postings by bank and unit. Remains the book of record and the place of cash planning.', 'Отримує звірені пакети розрахунків і проводки за банками й одиницями. Лишається основною книгою й місцем планування коштів.')],
              ['chart', t('Data and BI', 'Дані та BI'), t('Receives the event stream: every event with its unit, source and time, traceable to the bank’s file.', 'Отримує потік подій: кожну подію з одиницею, джерелом і часом, з можливістю простежити до файлу банку.')],
            ] as Array<[string, string, string]>).map(([icon, title, text]) => (
              <li key={title} className="bg-paper p-6">
                <Icon name={icon} className="size-6 text-river-700" />
                <p className="mt-4 text-lg font-semibold text-ink-900">{title}</p>
                <p className="mt-2 text-[0.93rem] text-ink-700">{text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-3xl text-[1.02rem] text-ink-700">{t('The platform does not run the tills and does not process store payments; it reads the banks’ reports about them. It does not replace the order system, the bonus system or accounting.', 'Платформа не керує касами й не проводить платежі в магазинах; вона читає звіти банків про них. Вона не замінює систему замовлень, бонусну систему чи облік.')}</p>
          <figure className="mt-12">
            <PaymentRiver stages={riverStages} streams={riverStreams}
              source={[t('Order', 'Замовлення'), t('from the order system', 'із системи замовлень')]} mouth={[t('Paid', 'Сплачено'), t('then settled by the bank', 'далі — розрахунок банку')]}
              legend={{ session: t('session', 'сесія'), order: t('order', 'замовлення'), invoice: t('invoice', 'інвойс'), payment: t('payment', 'платіж'), ledger: t('ledger', 'облік'), crossed: t('figures under the bridges: attempts that passed, 30 days', 'числа під мостами: спроби, що пройшли, 30 днів') }} />
            <figcaption className="annot mt-3 flex items-center gap-3 text-ink-500"><span className="h-px w-8 shrink-0 bg-graphite/40" aria-hidden="true" />{t('Fig. 2 — one online payment of the demo group, drawn as a river: the events it passes, the views each one forms, and how the money of the last 30 days divided.', 'Рис. 2 — один онлайн-платіж демо-групи у вигляді ріки: події, які він проходить, проєкції, що формує кожна, і як розділилися гроші за останні 30 днів.')}</figcaption>
          </figure>
        </Container>
      </section>

      <section className="border-t border-graphite/15 bg-paper-deep py-24">
        <Container>
          <SectionHeading index="04" title={t('The group as a tree of units', 'Група як дерево одиниць')} lead={t('Legal entities, regions, stores and online channels, as in a directory. Policies set on a unit apply below it — the routing strategy for the whole group, the terminal bank per region, capture after picking per channel — and every unit sees the payments of its subtree.', 'Юридичні особи, регіони, магазини й онлайн-канали — як у каталозі. Політики одиниці діють на все нижче — стратегія маршрутизації для всієї групи, банк терміналів для регіону, списання після комплектації для каналу, — і кожна одиниця бачить платежі свого піддерева.')} />
          <figure className="overflow-x-auto">
            <div className="min-w-[1100px]">
              <BasinDrawing nodes={tree} marks={marks} width={1400} height={treeHeight} legend={{ flows: t('channel width: money of the subtree, 30 days', 'ширина русла: гроші піддерева, 30 днів'), policies: t('policies apply to everything below', 'політики діють на все нижче'), enforced: t('enforces policies', 'закріплює політики'), blocked: t('blocks inheritance', 'блокує успадкування'), onboarding: t('onboarding', 'онбординг') }} />
            </div>
            <figcaption className="annot mt-3 text-ink-500">{t('Fig. 3 — the structure of the demo group; stores are left out for room. Online: payments captured; regions: the stores’ card turnover from the banks’ reports.', 'Рис. 3 — структура демо-групи; магазини не показано, щоб вмістити схему. Онлайн — списані платежі; регіони — картковий оборот магазинів зі звітів банків.')}</figcaption>
          </figure>
          <div className="mt-8"><Button href={href(locale, '/platform/hierarchy')} variant="secondary" size="sm">{t('How structure and policies work', 'Як працюють структура і політики')}<Icon name="arrow" className="size-4" /></Button></div>
        </Container>
      </section>

      <section className="border-t border-graphite/15 py-24">
        <Container>
          <SectionHeading index="05" title={t('Instruments of an online grocery', 'Інструменти онлайн-продажу продуктів')} lead={t('Each instrument has its own course — a 3-D Secure check, a bank’s consent, a scan, a lender’s approval — and the same handling from the capture on. Payments of the last 30 days:', 'Кожен інструмент має власне русло — перевірку 3-D Secure, згоду банку, сканування, схвалення кредитора — і однакову обробку від списання. Платежі за останні 30 днів:')} />
          <ul className="grid grid-cols-2 gap-px bg-graphite/20 sm:grid-cols-4 lg:grid-cols-8">
            {instrumentCatalogue.filter((i) => allowed.has(i.id)).map((i) => (
              <li key={i.id} className="bg-paper p-5">
                <Icon name={instrumentIcon(i.id)} className="size-6 text-ink-900" />
                <p className="mt-3 font-semibold text-ink-900">{pickText(i.label, locale)}</p>
                <p className="annot mt-1 text-ink-500">{count(byInstrument.get(i.id) ?? 0, locale)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8"><Button href={href(locale, '/platform/instruments')} variant="secondary" size="sm">{t('Each instrument’s course', 'Русло кожного інструменту')}<Icon name="arrow" className="size-4" /></Button></div>
        </Container>
      </section>

      <section className="border-t border-graphite/15 bg-ink-900 py-24 text-paper">
        <Container>
          <div className="mb-10 max-w-3xl">
            <p className="annot mb-4 flex items-center gap-3 text-paper/60"><span className="text-sunrise-300">§ 06</span><span className="h-px w-12 bg-paper/30" aria-hidden="true" /></p>
            <h2 className="text-3xl font-semibold leading-tight text-paper sm:text-[2.6rem]">{t('Agents that watch and propose', 'Агенти, що спостерігають і пропонують')}</h2>
            <p className="mt-4 text-lg text-paper/75">{t('The agents read the same views the cabinets show and never move money. Each proposal carries its evidence — a replay of routing, the lines of a bank’s report — and a person accepts or declines it. In the demo group they only propose.', 'Агенти читають ті самі проєкції, що й кабінети, і ніколи не рухають гроші. Кожна пропозиція містить докази — відтворення маршрутизації, рядки звіту банку, — і людина приймає чи відхиляє її. У демо-групі агенти лише пропонують.')}</p>
          </div>
          <ul className="grid gap-px bg-paper/15 sm:grid-cols-2 lg:grid-cols-4">
            {agentCatalogue.filter((a) => enabled.has(a.id)).map((a) => {
              const open = w.insights.filter((i) => i.agent === a.id && i.status === 'open').length;
              return (
                <li key={a.id} className="bg-ink-900 p-6">
                  <div className="flex items-center justify-between"><Icon name={a.glyph} className="size-6 text-sunrise-300" /><span className="annot text-paper/60">{open} {t('open', 'відкрито')}</span></div>
                  <p className="mt-4 text-lg font-semibold">{pickText(a.name, locale)}</p>
                  <p className="mt-2 text-[0.93rem] text-paper/70">{pickText(a.role, locale)}</p>
                </li>
              );
            })}
            <li className="bg-ink-900 p-6">
              <Icon name="coins" className="size-6 text-paper/40" />
              <p className="mt-4 text-lg font-semibold text-paper/70">{t('Cash forecasts', 'Прогнози коштів')}</p>
              <p className="mt-2 text-[0.93rem] text-paper/60">{t('Not an agent here: cash planning belongs to the group’s ERP. The platform gives it reconciled facts.', 'Тут це не агент: планування коштів належить ERP групи. Платформа дає їй звірені факти.')}</p>
            </li>
          </ul>
          <p className="annot mt-6 text-paper/60">{t('Proposals waiting for a person now', 'Пропозицій чекають рішення зараз')}: {openProposals}</p>
          <div className="mt-6"><Button href={href(locale, '/platform/agents')} size="sm">{t('How the agents work', 'Як працюють агенти')}<Icon name="arrow" className="size-4" /></Button></div>
        </Container>
      </section>

      <section className="border-t border-graphite/15 py-24">
        <Container>
          <SectionHeading index="07" title={t('A cabinet for each team', 'Кабінет для кожної команди')} lead={t('Each role sees its part of the same flows, within the units it is granted. Choose a person and work as them: every action passes the same access checks as in a deployment.', 'Кожна роль бачить свою частину тих самих потоків — у межах одиниць, до яких має доступ. Оберіть людину й працюйте від її імені: кожна дія проходить ті самі перевірки доступу, що й у розгортанні.')} />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {retailStand.personas.map((persona) => {
              const person = w.people.find((p) => p.id === persona.personId);
              const grant = w.grants.find((g) => g.personId === persona.personId && g.status === 'active');
              if (!person || !grant) return null;
              return (
                <li key={persona.personId} className="sketch bg-paper p-6">
                  <p className="annot text-sunrise-600">{pickText(roleText('retail', grant.role), locale)}</p>
                  <p className="mt-2 text-lg font-semibold text-ink-900">{pickText(person.name, locale)}</p>
                  <p className="annot mt-1 text-ink-500">{pickText(person.title, locale)}</p>
                  <p className="mt-3 text-[0.95rem] text-ink-700">{pickText(persona.description, locale)}</p>
                </li>
              );
            })}
          </ul>
          <div className="mt-10 flex flex-wrap gap-4"><Button href={href(locale, '/demo')}><Icon name="layers" />{t('Choose a cabinet', 'Обрати кабінет')}</Button><Button href={href(locale, '/developers')} variant="ghost">{t('Read the API', 'Переглянути API')}</Button></div>
        </Container>
      </section>

      <section className="border-t border-graphite/15 bg-paper-deep py-24">
        <Container>
          <SectionHeading index="08" title={t('One platform, assembled for the task', 'Одна платформа, зібрана під завдання')} lead={t('The platform is a set of modules: the same core of events, boundaries, structure, routing and agents is assembled differently for different clients. The demo runs two assemblies side by side.', 'Платформа — набір модулів: те саме ядро подій, меж, структури, маршрутизації й агентів по-різному збирається для різних клієнтів. Демо показує дві збірки поруч.')} />
          <div className="overflow-x-auto border border-graphite/20 bg-paper">
            <table className="w-full min-w-[640px] text-left text-[0.92rem]">
              <thead><tr className="border-b border-ink-900/80">{['', t('Retail group', 'Роздрібна група'), t('PSP and marketplace', 'PSP і маркетплейс')].map((h) => <th key={h} className="annot px-4 py-3 text-[0.6rem] font-normal text-ink-500">{h}</th>)}</tr></thead>
              <tbody>{assemblies.map(([en, uk, a, au, b, bu]) => <tr key={en} className="border-b border-graphite/15"><td className="px-4 py-3 text-ink-500">{t(en, uk)}</td><td className="px-4 py-3 text-ink-900">{t(a, au)}</td><td className="px-4 py-3 text-ink-700">{t(b, bu)}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="mt-6 max-w-3xl text-[0.98rem] text-ink-700">{t(`The PSP assembly of the demo holds its merchants’ money, splits marketplace payments between sellers and pays the shares out; ${count(capturedSince(psp, from).length, locale)} payments in the last 30 days. Its people are on the same demo page.`, `PSP-збірка демо тримає кошти мерчантів, розподіляє платежі маркетплейсу між продавцями й виплачує частки; ${count(capturedSince(psp, from).length, locale)} платежів за останні 30 днів. Її люди — на тій самій сторінці демо.`)}</p>
          <ol className="mt-12 grid gap-px bg-graphite/20 sm:grid-cols-2 lg:grid-cols-4">
            {articles.map((f, i) => (
              <li key={f.path} className="bg-paper">
                <Link href={href(locale, f.path)} className="group block h-full p-6 hover:bg-paper-deep">
                  <div className="flex items-center justify-between"><Icon name={f.icon} className="size-6 text-river-700" /><span className="font-mono text-sm text-sunrise-600">{String(i + 1).padStart(2, '0')}</span></div>
                  <h3 className="mt-4 text-lg font-semibold text-ink-900">{f.title}</h3>
                  <p className="mt-2 text-[0.92rem] text-ink-700">{f.text}</p>
                  <p className="annot mt-4 flex items-center gap-2 text-river-700 group-hover:text-ink-900">{t('Read', 'Читати')}<Icon name="arrow" className="size-3.5" /></p>
                </Link>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </>
  );
}
