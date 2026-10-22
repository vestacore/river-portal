import { pickText, type Locale } from '@river/i18n';
import { agentCatalogue } from '@river/psp-agents';
import { acquirers, issuers } from '@river/psp-instruments';
import { reconcileSettlements } from '@river/psp-runtime';
import { differenceLabels, reconciliationStatusLabels, settlementChannelLabels, type ReconciliationStatus } from '@river/psp-settlement';
import { reconciliationSince } from '@/lib/routingFigures';
import { count, day, money, percent } from '@/lib/format';
import { href } from '@/lib/href';
import { lt } from '@/lib/lt';
import { InsightCard } from '../cabinet/InsightCard';
import { ArticleFrame, Figure, Section, type ArticleWorlds } from './ArticleFrame';

const th = 'annot px-3 py-2 text-[0.56rem] font-normal text-ink-500';

/** Article 02 — settlement reconciliation: three records of one day, what counts as a difference, the fee audit, online batches, people's decisions, accounting. */
export function ReconciliationArticle({ locale, worlds }: { locale: Locale; worlds: ArticleWorlds }) {
  const t = lt(locale);
  const w = worlds.retail;
  const now = new Date().toISOString();
  const rows = reconcileSettlements(w, now);
  const summary = reconciliationSince(w, now, 30);
  const providerName = (id: string) => pickText(acquirers.find((a) => a.id === id)?.label, locale) || id;
  const unitName = (id: string | null) => (id ? pickText(w.units.find((u) => u.id === id)?.name, locale) : '');
  const reconciler = pickText(agentCatalogue.find((a) => a.id === 'reconciler')!.name, locale);
  const from = new Date(Date.parse(now) - 30 * 86_400_000).toISOString().slice(0, 10);

  const store = rows.find((r) => r.view.channel === 'in_store' && r.reconciliation.status === 'matched' && r.view.sales && r.view.reported && r.view.credited);
  const feeRows = rows.filter((r) => r.view.businessDate >= from && r.reconciliation.differences.some((d) => d.kind === 'fee'));
  const feeByProvider = new Map<string, { batches: number; deltaMinor: number }>();
  for (const r of feeRows) {
    const e = feeByProvider.get(r.view.provider) ?? { batches: 0, deltaMinor: 0 };
    e.batches += 1;
    e.deltaMinor += r.reconciliation.differences.filter((d) => d.kind === 'fee').reduce((s, d) => s + d.deltaMinor, 0);
    feeByProvider.set(r.view.provider, e);
  }
  const feeExample = feeRows[0];
  const online = rows.find((r) => r.view.channel === 'online' && r.reconciliation.status === 'matched' && (r.view.reported?.refundsMinor ?? 0) > 0) ?? rows.find((r) => r.view.channel === 'online' && r.reconciliation.status === 'matched');
  const carried = online ? [...w.views.payments.values()].filter((p) => p.payouts.some((x) => x.batchId === online.view.batchId)).length : 0;
  const claims = w.insights.filter((i) => i.agent === 'reconciler' && i.status === 'open').sort((a, b) => (a.proposal?.kind === 'raise_claim' ? -1 : 0) - (b.proposal?.kind === 'raise_claim' ? -1 : 0)).slice(0, 2);

  const statusText: Record<ReconciliationStatus, [string, string]> = {
    not_reported: ['the day had sales, but no report came from the provider within three days.', 'за день були продажі, але звіт провайдера не надійшов протягом трьох днів.'],
    not_credited: ['the provider reported a net amount, but nothing reached the account within two days of the value date.', 'провайдер звітував про суму до зарахування, але протягом двох днів після дати валютування на рахунок нічого не надійшло.'],
    short_credit: ['the bank credited a different amount from the one reported.', 'банк зарахував іншу суму, ніж у звіті.'],
    fee_difference: ['the provider’s fee differs from what the agreement gives for the cards in the report.', 'комісія провайдера відрізняється від тієї, що дає договір для карток у звіті.'],
    gross_difference: ['the provider reports a different turnover from the group’s own sales record.', 'провайдер звітує про інший оборот, ніж у власних даних продажів групи.'],
    resolved: ['a person recorded a decision about the difference.', 'людина записала рішення щодо розбіжності.'],
    awaiting_report: ['the report is not yet due.', 'звіт ще не мав надійти.'],
    awaiting_credit: ['the credit is not yet due.', 'зарахування ще не мало надійти.'],
    matched: ['all three records agree within the tolerance.', 'усі три записи збігаються в межах допуску.'],
  };

  return (
    <ArticleFrame locale={locale} slug="reconciliation" sheet="RP-02" title={t('Settlement reconciliation', 'Звірка розрахунків')}
      lead={t('Every bank that accepts payments for the group reports what it settled and credits the money to the group’s account. Reconciliation compares three records of the same day — what the group sold, what the bank reported, what arrived on the account — and shows where they differ. The platform does this for every bank and every store and passes the result to the group’s accounting system; it does not replace that system.', 'Кожен банк, що приймає платежі для групи, звітує, що він розрахував, і зараховує гроші на рахунок групи. Звірка порівнює три записи того самого дня — що група продала, що звітував банк і що надійшло на рахунок — і показує, де вони розходяться. Платформа робить це для кожного банку й кожного магазину та передає результат в облікову систему групи; цієї системи вона не замінює.')}
      cta={{ label: t('Open the reconciliation cabinet', 'Відкрити кабінет звірки'), path: '/demo' }}>

      <Section index="1" title={t('Three records of one day', 'Три записи одного дня')}>
        <p>{t('A settlement batch is one provider’s settlement for one unit and one business day: a store’s card payments at the tills, the online shop’s card payments, the day’s bonus points. Three records describe it, each from its own source:', 'Пакет розрахунку — це розрахунок одного провайдера для однієї одиниці за один робочий день: карткові платежі магазину на касах, карткові платежі інтернет-магазину, бонусні бали за день. Його описують три записи, кожен зі свого джерела:')}</p>
        <ul>
          <li><b>{t('The sales record', 'Дані продажів')}</b> — {t('what the group’s till system or order system counted: the number of payments and the turnover.', 'що порахувала касова система чи система замовлень групи: кількість платежів і оборот.')}</li>
          <li><b>{t('The acquirer’s report', 'Звіт еквайра')}</b> — {t('what the provider settles: turnover, its fee, the refunds and chargebacks it nets, the net amount, the value date, and a breakdown by issuing bank and card product.', 'що розраховує провайдер: оборот, його комісія, повернення й чарджбеки, які він утримує, сума до зарахування, дата валютування і розбивка за банками-емітентами та типами карток.')}</li>
          <li><b>{t('The bank credit', 'Зарахування')}</b> — {t('what arrived on the group’s account: the amount, the value date and the payment reference.', 'що надійшло на рахунок групи: сума, дата валютування і призначення платежу.')}</li>
        </ul>
        <p>{t('Each record arrives as an event in the batch’s own stream, and the batch’s view is formed from them. Nothing is typed in or overwritten: a late report or a corrected credit is one more event.', 'Кожен запис надходить як подія у власний потік пакета, і з них формується проєкція пакета. Нічого не вводиться вручну й не перезаписується: запізнілий звіт чи виправлене зарахування — ще одна подія.')}</p>
        {store ? (
          <Figure caption={`${t('Fig. 2.1 — a store’s batch, three ways', 'Рис. 2.1 — пакет магазину у трьох записах')} · ${unitName(store.view.storeId)} · ${providerName(store.view.provider)} · ${day(store.view.businessDate, locale)}`}>
            <table className="w-full min-w-[560px] text-left text-[0.84rem]">
              <thead><tr className="border-b border-ink-900/80">{['', t('Sales record', 'Дані продажів'), t('Acquirer’s report', 'Звіт еквайра'), t('Bank credit', 'Зарахування')].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>
                <tr className="border-b border-graphite/15"><td className="px-3 py-2 text-ink-500">{t('Payments', 'Платежів')}</td><td className="px-3 py-2 tabular-nums">{count(store.view.sales!.count, locale)}</td><td className="px-3 py-2 tabular-nums">{count(store.view.reported!.count, locale)}</td><td className="px-3 py-2">—</td></tr>
                <tr className="border-b border-graphite/15"><td className="px-3 py-2 text-ink-500">{t('Turnover', 'Оборот')}</td><td className="px-3 py-2 tabular-nums">{money(store.view.sales!.grossMinor, 'UAH', locale)}</td><td className="px-3 py-2 tabular-nums">{money(store.view.reported!.grossMinor, 'UAH', locale)}</td><td className="px-3 py-2">—</td></tr>
                <tr className="border-b border-graphite/15"><td className="px-3 py-2 text-ink-500">{t('Fee', 'Комісія')}</td><td className="px-3 py-2 tabular-nums">{store.reconciliation.expected?.feeMinor != null ? `${money(store.reconciliation.expected.feeMinor, 'UAH', locale)} ${t('by the agreement', 'за договором')}` : '—'}</td><td className="px-3 py-2 tabular-nums">{money(store.view.reported!.feeMinor, 'UAH', locale)}</td><td className="px-3 py-2">—</td></tr>
                <tr className="border-b border-graphite/15"><td className="px-3 py-2 text-ink-500">{t('Net', 'До зарахування')}</td><td className="px-3 py-2">—</td><td className="px-3 py-2 tabular-nums">{money(store.view.reported!.netMinor, 'UAH', locale)}</td><td className="px-3 py-2 tabular-nums">{money(store.view.credited!.amountMinor, 'UAH', locale)}</td></tr>
                <tr><td className="px-3 py-2 text-ink-500">{t('Date', 'Дата')}</td><td className="px-3 py-2">{day(store.view.businessDate, locale)}</td><td className="px-3 py-2">{day(store.view.reported!.valueDate, locale)}</td><td className="px-3 py-2">{day(store.view.credited!.valueDate, locale)}</td></tr>
              </tbody>
            </table>
          </Figure>
        ) : null}
      </Section>

      <Section index="2" title={t('What counts as a difference', 'Що вважається розбіжністю')}>
        <p>{t('A batch is compared field by field. Differences within one hryvnia — or a kopiyka per payment, whichever is larger — are rounding and are not reported. Every batch then has one status, the most urgent of what was found:', 'Пакет порівнюється поле за полем. Розбіжності в межах однієї гривні — або копійки на платіж, якщо це більше, — вважаються округленням і не показуються. Кожен пакет отримує один статус — найтерміновіший із виявленого:')}</p>
        <ul>{(Object.keys(statusText) as ReconciliationStatus[]).map((s) => <li key={s}><b>{pickText(reconciliationStatusLabels[s], locale)}</b> — {t(statusText[s][0], statusText[s][1])}</li>)}</ul>
        <p>{t(`In the last 30 days the demo group had ${count(summary.batches, locale)} batches from ${summary.providers} providers and ${summary.stores} stores. ${count(summary.matched, locale)} matched (${percent(summary.batches ? Math.round((summary.matched / summary.batches) * 10_000) : 0, locale)}); ${summary.open} need a person:`, `За останні 30 днів демо-група мала ${count(summary.batches, locale)} пакетів від ${summary.providers} провайдерів і ${summary.stores} магазинів. Звірено ${count(summary.matched, locale)} (${percent(summary.batches ? Math.round((summary.matched / summary.batches) * 10_000) : 0, locale)}); ${summary.open} потребують людини:`)}</p>
        <ul>{[...summary.byStatus.entries()].map(([s, x]) => <li key={s}>{pickText(reconciliationStatusLabels[s as ReconciliationStatus], locale)}: <b>{x.count}</b> · {money(x.deltaMinor, 'UAH', locale)}</li>)}</ul>
      </Section>

      <Section index="3" title={t('Checking the fees', 'Перевірка комісій')}>
        <p>{t('A blended rate is easy to check. Interchange++ and on-us clauses are not: the fee depends on every card. Because the bank’s report breaks the day down by issuing bank and card product, the platform prices every line of it under the agreement — the same calculation that prices a payment for routing — and compares the total with the fee the bank kept.', 'Єдину ставку перевірити легко. Interchange++ і умови on-us — ні: комісія залежить від кожної картки. Оскільки звіт банку розбиває день за банками-емітентами й типами карток, платформа оцінює кожен його рядок за договором — тим самим розрахунком, що оцінює платіж для маршрутизації, — і порівнює підсумок із комісією, яку утримав банк.')}</p>
        {feeByProvider.size > 0 ? <ul>{[...feeByProvider.entries()].map(([p, x]) => <li key={p}>{providerName(p)}: <b>{x.batches}</b> {t('batches with a fee above the agreement, together', 'пакетів із комісією понад договір, разом')} <b>{money(x.deltaMinor, 'UAH', locale)}</b> {t('in 30 days', 'за 30 днів')}</li>)}</ul> : null}
        {feeExample?.view.reported ? (
          <>
            <p>{t('In the demo, one bank bills part of the debit cards in one region as premium cards. Per day the difference is small; over weeks it is a claim. One of those batches, line by line:', 'У демо один банк тарифікує частину дебетових карток в одному регіоні як преміальні. За день різниця невелика; за тижні — це претензія. Один із таких пакетів, рядок за рядком:')}</p>
            <Figure caption={`${t('Fig. 2.2 — the report’s lines', 'Рис. 2.2 — рядки звіту')} · ${unitName(feeExample.view.storeId ?? feeExample.view.merchantId)} · ${providerName(feeExample.view.provider)} · ${day(feeExample.view.businessDate, locale)}`}>
              <table className="w-full min-w-[560px] text-left text-[0.84rem]">
                <thead><tr className="border-b border-ink-900/80">{[t('Issuing bank', 'Банк-емітент'), t('Scheme · product', 'Система · тип'), t('Payments', 'Платежів'), t('Turnover', 'Оборот'), t('Fee reported', 'Комісія у звіті')].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody>{feeExample.view.reported.lines.map((l, i) => <tr key={i} className="border-b border-graphite/15"><td className="px-3 py-1.5">{l.issuer ? pickText(issuers.find((x) => x.id === l.issuer)?.name, locale) : t('other', 'інші')}</td><td className="px-3 py-1.5 font-mono text-[0.75rem]">{l.scheme} · {l.product}</td><td className="px-3 py-1.5 tabular-nums">{l.count}</td><td className="px-3 py-1.5 tabular-nums">{money(l.grossMinor, 'UAH', locale)}</td><td className="px-3 py-1.5 tabular-nums">{money(l.feeMinor, 'UAH', locale)}</td></tr>)}</tbody>
              </table>
              <p className="annot mt-3 text-[0.6rem] text-ink-500">{feeExample.reconciliation.differences.map((d) => `${pickText(differenceLabels[d.kind], locale)}: ${money(d.expectedMinor, 'UAH', locale)} → ${money(d.actualMinor, 'UAH', locale)} (${d.deltaMinor > 0 ? '+' : ''}${money(d.deltaMinor, 'UAH', locale)})`).join(' · ')}</p>
            </Figure>
          </>
        ) : null}
      </Section>

      <Section index="4" title={t('Online payments and bonus points', 'Онлайн-платежі та бонусні бали')}>
        <p>{t('For online payments the platform knows each payment it carried, so what a batch should hold comes from those payments: the turnover and the fee of each one. Refunds and lost disputes are netted by the bank in a later batch, and the report says by how much. Bonus points are settled the same way through the group’s bonus system: they are a tender like any other, but no money moves.', 'Для онлайн-платежів платформа знає кожен проведений нею платіж, тож те, що має містити пакет, визначається цими платежами: оборот і комісія кожного. Повернення й програні спори банк утримує в одному з наступних пакетів, і звіт показує, на яку суму. Бонусні бали розраховуються так само через бонусну систему групи: це такий самий спосіб оплати, але гроші при цьому не рухаються.')}</p>
        {online?.view.reported ? <p>{t(`For example, ${providerName(online.view.provider)}’s batch for ${unitName(online.view.merchantId)} of ${day(online.view.businessDate, locale)} carried ${carried} payments: turnover ${money(online.view.reported.grossMinor, 'UAH', locale)}, fee ${money(online.view.reported.feeMinor, 'UAH', locale)}, refunds netted ${money(online.view.reported.refundsMinor, 'UAH', locale)}, credited ${money(online.view.credited?.amountMinor ?? 0, 'UAH', locale)}.`, `Наприклад, пакет «${providerName(online.view.provider)}» для «${unitName(online.view.merchantId)}» за ${day(online.view.businessDate, locale)} містив ${carried} платежів: оборот ${money(online.view.reported.grossMinor, 'UAH', locale)}, комісія ${money(online.view.reported.feeMinor, 'UAH', locale)}, утримано повернень ${money(online.view.reported.refundsMinor, 'UAH', locale)}, зараховано ${money(online.view.credited?.amountMinor ?? 0, 'UAH', locale)}.`)}</p> : null}
        <p>{t('Channels on the stand:', 'Канали на стенді:')} {Object.entries(settlementChannelLabels).map(([k, v]) => `${pickText(v, locale).toLowerCase()} (${rows.filter((r) => r.view.channel === k && r.view.businessDate >= from).length})`).join(', ')}.</p>
      </Section>

      <Section index="5" title={t('A person decides', 'Рішення ухвалює людина')}>
        <p>{t(`A difference is closed by a person’s decision, recorded as an event with who decided, the amount and the reason: accepted, a claim raised with the provider, written off, or corrected. The batch keeps its whole history. The ${reconciler} agent reads the same batches, groups fee differences by provider into one claim, and proposes; the finance controller decides. Open proposals on the stand now:`, `Розбіжність закривається рішенням людини, записаним як подія з автором, сумою й причиною: прийнято, подано претензію провайдеру, списано чи виправлено. Пакет зберігає всю свою історію. Агент «${reconciler}» читає ті самі пакети, групує розбіжності в комісіях за провайдером в одну претензію й пропонує; рішення ухвалює фінансовий контролер. Відкриті пропозиції на стенді зараз:`)}</p>
        <div className="not-prose grid gap-3">{claims.map((i) => <InsightCard key={i.id} insight={i} locale={locale} link={(p) => href(locale, `/cabinet${p}`)} back={href(locale, '/platform/reconciliation')} canDecide={false} personName={(id) => pickText(w.people.find((p) => p.id === id)?.name, locale) || id} />)}</div>
      </Section>

      <Section index="6" title={t('Into accounting', 'В облік')}>
        <p>{t('The platform sends the reconciled batches and the postings they imply to the group’s accounting system: turnover, fee, refunds and net per bank and unit, with the batch reference. The accounting system stays the book of record. Cash planning and forecasts stay there as well; the platform gives them facts, not forecasts.', 'Платформа передає звірені пакети й проводки, що з них випливають, в облікову систему групи: оборот, комісію, повернення й суму до зарахування за кожним банком і одиницею, з посиланням на пакет. Облікова система лишається основною книгою. Планування коштів і прогнози теж лишаються там; платформа дає їм факти, а не прогнози.')}</p>
        <p>{t('The same events serve a data warehouse or BI: each one carries its batch, its unit and its source, so a report built on them can always be traced back to a bank’s file.', 'Ті самі події придатні для сховища даних чи BI: кожна несе свій пакет, свою одиницю й джерело, тож звіт, побудований на них, завжди можна простежити до файлу банку.')}</p>
      </Section>
    </ArticleFrame>
  );
}
