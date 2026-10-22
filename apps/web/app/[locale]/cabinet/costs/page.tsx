import Link from 'next/link';
import { pickText } from '@river/i18n';
import { interchangeBps, schemeFeeBps } from '@river/psp-contracts';
import { reconcileSettlements } from '@river/psp-runtime';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { ScopePicker } from '@/components/cabinet/ScopePicker';
import { AcquiringTermsTable } from '@/components/cabinet/routing/AcquiringTermsTable';
import { CostTable, type CostRow } from '@/components/cabinet/routing/CostTable';
import { Flash } from '@/components/panels/Flash';
import { Metric } from '@/components/panels/Metric';
import { Panel } from '@/components/panels/Panel';
import { cabinet } from '@/lib/cabinet';
import { count, day, money, percent } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { acceptanceCosts, type CostLine } from '@/lib/routing/acceptanceCosts';
import { acquirerName } from '@/lib/routing/acquirerName';
import { countText } from '@/lib/routing/countText';
import { bankName } from '@/lib/routing/bankName';
import { cardProductText } from '@/lib/routing/cardProductText';
import { railText } from '@/lib/routing/railText';
import { rateBps } from '@/lib/routing/rateBps';
import { storeCosts } from '@/lib/routing/storeCosts';
import { readQuery } from '@/lib/table';

const month = 30 * 86_400_000;

/**
 * The cost of acceptance over the last thirty days, within the reach: online card payments by acquirer,
 * by card product and on-us against the rest; the other rails; the stores' card payments from the terminal
 * banks' reports; the terms in force; the fees the banks billed above those terms; and what a card
 * payment's cost is made of, in plain words. Where the platform holds the money, the PSP's fee instead.
 */
export default async function Costs({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = resolveLocale((await params).locale);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, query.unit, 'costs.read');
  const { t } = c;
  const from = new Date(Date.parse(c.now) - month).toISOString();
  const costs = acceptanceCosts(c.w, c.visible, from, c.now);
  const direct = costs.feeKind === 'acquirer';
  const stores = storeCosts(c.w, c.visible, from.slice(0, 10));
  const inReach = (v: { storeId: string | null; merchantId: string }) => (v.storeId ? c.visible.has(v.storeId) : c.visible.has(v.merchantId));
  const differences = direct && c.w.views.settlements.size > 0 ? reconcileSettlements(c.w, c.now).filter((r) => r.reconciliation.status === 'fee_difference' && inReach(r.view)) : [];
  const audit = [...differences.reduce((m, r) => {
    const e = m.get(r.view.provider) ?? { provider: r.view.provider, currency: r.view.currency, batches: 0, deltaMinor: 0, latest: '' };
    e.batches += 1;
    e.deltaMinor += r.reconciliation.differences.filter((d) => d.kind === 'fee').reduce((s, d) => s + d.deltaMinor, 0);
    if (r.view.businessDate > e.latest) e.latest = r.view.businessDate;
    return m.set(r.view.provider, e);
  }, new Map<string, { provider: string; currency: string; batches: number; deltaMinor: number; latest: string }>()).values()].sort((a, b) => b.deltaMinor - a.deltaMinor);
  const terms = c.w.acquiring.filter((x) => c.visible.has(x.merchantId)).sort((a, b) => c.w.providers.indexOf(a.acquirerId) - c.w.providers.indexOf(b.acquirerId) || b.channel.localeCompare(a.channel));
  const feeLabel = direct ? t('Acquiring fee', 'Комісія еквайрингу') : t('PSP fee', 'Комісія PSP');
  const row = (l: CostLine, label: CostRow['label'], extra?: CostRow['extra'], sub?: CostRow['sub']): CostRow => ({ key: `${l.key}|${l.provider ?? ''}|${l.currency}`, label, count: l.count, grossMinor: l.grossMinor, feeMinor: l.feeMinor, currency: l.currency, ...(extra ? { extra } : {}), ...(sub ? { sub } : {}) });
  const card = costs.card[0];
  const cardCount = costs.card.reduce((s, l) => s + l.count, 0);
  const rails = { count: costs.rails.reduce((s, l) => s + l.count, 0), fee: costs.rails.reduce((s, l) => s + l.feeMinor, 0), currency: costs.rails[0]?.currency ?? 'UAH' };
  const store = { gross: stores.reduce((s, l) => s + l.grossMinor, 0), fee: stores.reduce((s, l) => s + l.feeMinor, 0), batches: stores.reduce((s, l) => s + l.batches, 0), currency: stores[0]?.currency ?? 'UAH' };
  const overbilled = audit.reduce((s, a) => s + a.deltaMinor, 0);
  const online = cardCount > 0 || rails.count > 0;
  const ic = (product: string) => (product === 'other' ? `${percent(interchangeBps.domestic.other ?? 0, locale, 2)} – ${percent(interchangeBps.crossBorder, locale, 2)}` : `${percent(interchangeBps.domestic[product] ?? 0, locale, 2)}${product === 'debit' ? ` · ПРОСТІР ${percent(interchangeBps.prostir, locale, 2)}` : ''}`);
  const termsNote = (provider: string | null) => {
    const x = provider ? c.w.acquiring.find((a) => a.acquirerId === provider && a.channel === 'online' && c.visible.has(a.merchantId)) : undefined;
    return x ? pickText(x.note, locale) : '';
  };
  const terminology: Array<[string, string]> = [
    [t('Interchange', 'Interchange (міжбанківська комісія)'), t('The part of the fee that goes to the bank that issued the card. For domestic consumer cards in Ukraine it is capped at 1.2 %; commercial and foreign cards are not under the cap.', 'Частина комісії, що йде банку, який випустив картку. Для українських споживчих карток її обмежено 1,2 %; на корпоративні й іноземні картки обмеження не поширюється.')],
    [t('Scheme fees', 'Збори платіжних систем'), t('What Visa, Mastercard or ПРОСТІР charge for carrying the payment.', 'Те, що беруть Visa, Mastercard чи ПРОСТІР за проведення платежу.')],
    [t('Acquirer’s markup', 'Маржа еквайра'), t('What the acquirer keeps for its own work.', 'Те, що еквайр залишає собі за власну роботу.')],
    [t('Blended rate', 'Єдина ставка'), t('One rate for every card: the three parts are inside it and not shown.', 'Одна ставка для будь-якої картки: три складники всередині неї й окремо не показуються.')],
    ['Interchange++', t('Interchange and scheme fees pass through at cost, and the acquirer adds its markup: ordinary debit cards cost less, premium and commercial cards more.', 'Interchange і збори платіжних систем переходять за собівартістю, а еквайр додає свою маржу: звичайні дебетові картки коштують менше, преміальні й корпоративні — більше.')],
    ['On-us', t('The card was issued by the same bank that accepts it. The bank is on both sides and pays no interchange to another bank; an on-us clause in the terms prices such payments at a lower on-us rate. Without the clause the usual rate applies.', 'Картку випустив той самий банк, що її приймає. Банк на обох боках і не платить interchange іншому банку; умова on-us у договорі оцінює такі платежі за нижчою ставкою on-us. Без такої умови діє звичайна ставка.')],
    [t('Effective rate', 'Ефективна ставка'), t('The fee divided by the amount, whatever the model: the one figure that compares them.', 'Комісія, поділена на суму, за будь-якої моделі: одна цифра, якою їх можна порівняти.')],
  ];
  const assumptions: Array<[string, number]> = [
    [t('Debit', 'Дебетові'), interchangeBps.domestic.debit ?? 0], [t('Credit', 'Кредитні'), interchangeBps.domestic.credit ?? 0], [t('Premium', 'Преміальні'), interchangeBps.domestic.premium ?? 0],
    [t('Commercial', 'Корпоративні'), interchangeBps.domestic.commercial ?? 0], ['ПРОСТІР', interchangeBps.prostir], [t('Foreign cards', 'Іноземні картки'), interchangeBps.crossBorder],
  ];
  return (
    <>
      <CabinetHead kicker={t('Money', 'Гроші')} title={t('Cost of acceptance', 'Собівартість приймання платежів')}
        lead={direct
          ? t('What accepting payments cost the units of your reach over the last 30 days: online, by every rail, and at the tills from the banks’ reports. The banks settle to the group’s own accounts; the platform holds no money and takes no percentage.', 'Скільки коштувало приймання платежів одиницям у ваших межах за останні 30 днів: онлайн, за кожною рейкою, і на касах — зі звітів банків. Банки розраховуються напряму з рахунками групи; платформа коштів не тримає й відсотка не бере.')
          : t('What payments cost the merchants of your reach over the last 30 days: the PSP’s fee under each merchant’s tariff, taken at capture.', 'Скільки коштували платежі мерчантам у ваших межах за останні 30 днів: комісія PSP за тарифом кожного мерчанта, яку беруть під час списання.')}
        actions={<ScopePicker w={c.w} rootId={c.actor.unitId} focus={c.focus} locale={locale} query={query} />} />
      <Flash query={query} locale={locale} />

      {direct ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {online ? (
              <>
                <Metric label={t('Online card payments', 'Онлайн-платежі карткою')} value={money(card?.grossMinor ?? 0, card?.currency ?? 'UAH', locale, true)} note={t(`${count(cardCount, locale)} captured in 30 days`, `списано за 30 днів: ${count(cardCount, locale)}`)} />
                <Metric label={t('Acquiring fee, online cards', 'Комісія еквайрингу, онлайн-картки')} value={money(card?.feeMinor ?? 0, card?.currency ?? 'UAH', locale)} note={t(`effective rate ${percent(rateBps(card?.feeMinor ?? 0, card?.grossMinor ?? 0), locale, 2)}`, `ефективна ставка ${percent(rateBps(card?.feeMinor ?? 0, card?.grossMinor ?? 0), locale, 2)}`)} href={c.link('/routes')} />
                <Metric label={t('Other online rails', 'Інші онлайн-рейки')} value={money(rails.fee, rails.currency, locale)} note={t(`fees on ${count(rails.count, locale)} payments by A2A, transfer, instalments, bonus points`, `комісії з ${count(rails.count, locale)} платежів через A2A, перекази, частини, бонусні бали`)} />
              </>
            ) : null}
            {stores.length > 0 ? (
              <>
                <Metric label={t('Store card turnover', 'Картковий оборот магазинів')} value={money(store.gross, store.currency, locale, true)} note={t(`${count(store.batches, locale)} daily reports of the terminal banks`, `щоденних звітів банків терміналів: ${count(store.batches, locale)}`)} />
                <Metric label={t('Store card fee', 'Комісія за картки в магазинах')} value={money(store.fee, store.currency, locale, true)} note={t(`effective rate ${percent(rateBps(store.fee, store.gross), locale, 2)}`, `ефективна ставка ${percent(rateBps(store.fee, store.gross), locale, 2)}`)} />
              </>
            ) : null}
            <Metric label={t('Billed above the terms', 'Нараховано понад умови')} value={money(overbilled, audit[0]?.currency ?? 'UAH', locale)} tone={overbilled > 0 ? 'danger' : 'success'} note={countText(differences.length, locale, ['batch with a fee difference', 'batches with a fee difference'], ['пакет із різницею в комісії', 'пакети з різницею в комісії', 'пакетів із різницею в комісії'])} href={c.link('/settlements?status=fee_difference')} />
          </div>

          {online ? (
            <div className="mt-6 grid gap-6 2xl:grid-cols-2">
              <Panel flush title={t('Online card payments by acquirer', 'Онлайн-платежі карткою за еквайрами')} note={t('Captured in the last 30 days; the fee is the acquirer’s share of each payment’s split.', 'Списані за останні 30 днів; комісія — частка еквайра в розподілі кожного платежу.')}>
                <div className="px-1"><CostTable first={t('Acquirer', 'Еквайр')} feeLabel={feeLabel} locale={locale} total extraHead={[t('On-us share', 'Частка on-us')]}
                  rows={costs.byAcquirer.map((l) => row(l, acquirerName(l.key, locale), [<span key="s" className="tabular-nums">{percent(l.count ? (l.onUsCount / l.count) * 10_000 : 0, locale)}</span>], bankName(l.key, locale) ?? undefined))} /></div>
              </Panel>
              <Panel flush title={t('On-us and other cards', 'On-us та інші картки')} note={t('On-us: the card was issued by the bank whose acquirer carried the payment.', 'On-us: картку випустив банк, чий еквайр провів платіж.')}>
                <div className="px-1"><CostTable first={t('Cards', 'Картки')} feeLabel={feeLabel} locale={locale} total extraHead={[t('Share of payments', 'Частка платежів')]}
                  rows={costs.byOnUs.map((l) => row(l, l.key === 'on_us' ? t('On-us', 'On-us') : t('Other cards', 'Інші картки'), [<span key="s" className="tabular-nums">{percent(cardCount ? (l.count / cardCount) * 10_000 : 0, locale)}</span>], l.key === 'on_us' ? t('priced at the on-us rate of the terms', 'за ставкою on-us з умов') : t('interchange to another bank', 'interchange іншому банку')))} /></div>
              </Panel>
              <Panel flush title={t('By card product', 'За типом картки')} note={t('Interchange is the demo’s assumption for domestic cards; it is what the cheaper and the dearer cards differ by under Interchange++.', 'Interchange — припущення демо для українських карток; саме ним відрізняються дешевші й дорожчі картки за моделлю Interchange++.')}>
                <div className="px-1"><CostTable first={t('Card product', 'Тип картки')} feeLabel={feeLabel} locale={locale} total extraHead={['Interchange']}
                  rows={costs.byProduct.map((l) => row(l, cardProductText(l.key, locale), [<span key="i" className="whitespace-nowrap tabular-nums">{ic(l.key)}</span>]))} /></div>
              </Panel>
              <Panel flush title={t('Other rails', 'Інші рейки')} note={t('Account-to-account transfers, bank transfers, instalments and the group’s own bonus points, captured in the last 30 days.', 'Перекази з рахунку на рахунок, банківські перекази, оплата частинами й власні бонусні бали групи, списані за останні 30 днів.')}>
                <div className="px-1"><CostTable first={t('Rail', 'Рейка')} feeLabel={t('Provider’s fee', 'Комісія провайдера')} locale={locale} total extraHead={[t('Terms', 'Умови')]}
                  rows={costs.rails.map((l) => row(l, railText(l.key, locale), [<span key="n" className="text-[0.8rem]">{termsNote(l.provider)}</span>], l.provider ? acquirerName(l.provider, locale) : undefined))} /></div>
              </Panel>
            </div>
          ) : (
            <Panel className="mt-6"><p className="text-ink-500">{t('No online payments within your reach in the last 30 days.', 'За останні 30 днів у ваших межах не було онлайн-платежів.')}</p></Panel>
          )}

          {stores.length > 0 ? (
            <Panel className="mt-6" flush title={t('Store card payments by terminal bank', 'Карткові платежі в магазинах за банками терміналів')}
              note={t('Payments at the tills go through the banks’ own terminals: the platform does not carry them. These figures are what the banks reported for the business days of the last 30 days; the platform reconciles them against the tills and the terms.', 'Платежі на касах проходять через власні термінали банків: платформа їх не проводить. Ці цифри — те, що банки повідомили за робочі дні останніх 30 днів; платформа звіряє їх із касами та умовами.')}
              actions={<Link href={c.link('/routes')} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('Terminal banks by region', 'Банки терміналів за регіонами')} →</Link>}>
              <div className="px-1"><CostTable first={t('Terminal bank', 'Банк терміналів')} feeLabel={t('Fee billed', 'Нарахована комісія')} countLabel={t('Card payments', 'Карткові платежі')} grossLabel={t('Card turnover', 'Картковий оборот')} locale={locale} total extraHead={[t('Stores reported', 'Магазинів у звітах'), t('Its own cards', 'Власні картки')]}
                rows={stores.map((l) => ({ key: `${l.provider}|${l.currency}`, label: acquirerName(l.provider, locale), ...(bankName(l.provider, locale) ? { sub: bankName(l.provider, locale) } : {}), count: l.count, grossMinor: l.grossMinor, feeMinor: l.feeMinor, currency: l.currency, extra: [<span key="s" className="tabular-nums">{count(l.stores, locale)}</span>, <span key="o" className="tabular-nums">{percent(rateBps(l.onUsGrossMinor, l.grossMinor), locale)}</span>] }))} /></div>
            </Panel>
          ) : null}

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Panel flush title={t('Fee audit', 'Перевірка комісій')} note={t('Settlement batches whose provider billed more than the terms give for the same cards. Reconciliation prices every line of a bank’s breakdown under the terms and compares.', 'Пакети розрахунків, у яких провайдер нарахував більше, ніж передбачають умови для тих самих карток. Звірка оцінює кожен рядок розбивки банку за умовами й порівнює.')}
              actions={<Link href={c.link('/settlements?status=fee_difference')} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('Open the batches', 'Відкрити пакети')} →</Link>}>
              {audit.length === 0 ? <p className="p-4 text-ink-500">{t('Every reported fee matches the terms.', 'Кожна повідомлена комісія відповідає умовам.')}</p> : (
                <div className="relative overflow-x-auto px-1">
                  <table className="w-full text-left text-[0.86rem]">
                    <thead><tr className="border-b border-ink-900/80">{[t('Provider', 'Провайдер'), t('Batches', 'Пакети'), t('Billed above the terms', 'Понад умови'), t('Latest business day', 'Останній робочий день')].map((h, i) => <th key={h} scope="col" className={`annot px-3 py-2.5 text-[0.58rem] font-normal text-ink-500 ${i === 1 || i === 2 ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
                    <tbody>{audit.map((a) => (
                      <tr key={a.provider} className="border-b border-graphite/15">
                        <td className="px-3 py-2 text-ink-900">{acquirerName(a.provider, locale)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-ink-900">{count(a.batches, locale)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-attention-500">{money(a.deltaMinor, a.currency, locale)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-ink-700">{a.latest ? day(`${a.latest}T12:00:00.000Z`, locale) : '—'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </Panel>
            <Panel title={t('What a card payment’s cost is made of', 'З чого складається вартість карткового платежу')}>
              <dl className="space-y-2.5 text-[0.86rem]">
                {terminology.map(([term, text]) => <div key={term}><dt className="font-semibold text-ink-900">{term}</dt><dd className="text-ink-700">{text}</dd></div>)}
              </dl>
              <div className="mt-4 border-t border-graphite/20 pt-3">
                <p className="annot mb-2 text-[0.58rem] text-ink-500">{t('Interchange in this demo', 'Interchange у цьому демо')}</p>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-[0.84rem] sm:grid-cols-3">{assumptions.map(([label, bps]) => <li key={label} className="flex justify-between gap-2"><span className="text-ink-700">{label}</span><span className="tabular-nums text-ink-900">{percent(bps, locale, 2)}</span></li>)}</ul>
                <p className="mt-2 text-[0.8rem] text-ink-500">{t(`Scheme fees: Visa and Mastercard ${percent(schemeFeeBps.visa ?? 0, locale, 2)}, ПРОСТІР ${percent(schemeFeeBps.prostir ?? 0, locale, 2)}. These are the demo’s assumptions, not published rates; real rates come from the schemes’ tables and the acquirers’ Interchange++ reports.`, `Збори платіжних систем: Visa і Mastercard ${percent(schemeFeeBps.visa ?? 0, locale, 2)}, ПРОСТІР ${percent(schemeFeeBps.prostir ?? 0, locale, 2)}. Це припущення демо, а не опубліковані ставки; справжні ставки — у таблицях платіжних систем і звітах еквайрів за Interchange++.`)}</p>
              </div>
            </Panel>
          </div>

          {terms.length > 0 ? (
            <Panel className="mt-6" flush title={t('The terms in force', 'Чинні умови')} note={t('What each bank charges the group, by channel — the prices every routing decision and every reconciliation use.', 'Скільки кожен банк бере з групи, за каналами, — ціни, якими користуються кожне рішення маршрутизації й кожна звірка.')}
              actions={<Link href={c.link('/tariffs')} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('All acquiring terms', 'Усі умови еквайрингу')} →</Link>}>
              <div className="px-1"><AcquiringTermsTable terms={terms} c={c} locale={locale} compact /></div>
            </Panel>
          ) : null}
        </>
      ) : (
        <Panel flush title={t('The PSP’s fee by rail', 'Комісія PSP за рейками')} note={t('Captured in the last 30 days. The fee of each payment is taken at its capture under the merchant’s tariff.', 'Списані за останні 30 днів. Комісію з кожного платежу беруть під час списання за тарифом мерчанта.')}
          actions={<Link href={c.link('/tariffs')} className="annot text-[0.6rem] text-river-700 hover:text-ink-900">{t('Tariffs', 'Тарифи')} →</Link>}>
          <div className="px-1"><CostTable first={t('Rail', 'Рейка')} feeLabel={feeLabel} locale={locale} total
            rows={[...costs.card, ...costs.rails].sort((a, b) => b.currency.localeCompare(a.currency)).map((l) => row(l, railText(l.key, locale), undefined, l.provider ? acquirerName(l.provider, locale) : undefined))} /></div>
        </Panel>
      )}
    </>
  );
}
