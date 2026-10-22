import type { Metadata } from 'next';
import { pickText } from '@river/i18n';
import { acquiringCostOf, acquiringModelLabels, feeFor } from '@river/psp-contracts';
import { instrumentIds, type InstrumentId } from '@river/psp-facts';
import { acquirers, findInstrument, issuers, type CardProduct, type CardScheme } from '@river/psp-instruments';
import { PageHead } from '@/components/site/PageHead';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { money, percent } from '@/lib/format';
import { lt } from '@/lib/lt';
import { resolveLocale } from '@/lib/resolveLocale';
import { world } from '@/lib/world';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: lt(resolveLocale((await params).locale))('Cost and pricing', 'Вартість і тарифи') };
}

type Query = { bank?: string; product?: string; channel?: string; amount?: string; tariff?: string; instrument?: string; pamount?: string };

const products: CardProduct[] = ['debit', 'credit', 'premium', 'commercial'];

/**
 * What a payment costs. In the retail assembly the platform takes no share of payments: the cost is the
 * bank's fee under the group's own agreement, priced here for one payment at each acquirer, by card and
 * channel. The PSP assembly's tariffs follow, with their calculator. Both work without scripts.
 */
export default async function Pricing({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Query> }) {
  const locale = resolveLocale((await params).locale);
  const t = lt(locale);
  const q = await searchParams;
  const r = world('retail');
  const p = world('psp');
  const field = 'border border-graphite/30 bg-paper px-2 py-1.5 text-sm';
  const button = 'chamfer inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-paper [--cut:7px] [--fill:var(--color-ink-900)]';
  const th = 'annot px-3 py-2 text-[0.56rem] font-normal text-ink-500';

  // The cost of one card payment under the retail group's agreements.
  const home = issuers.filter((i) => i.country === 'UA');
  const bank = home.find((i) => i.id === q.bank) ?? home[0]!;
  const product: CardProduct = products.includes(q.product as CardProduct) ? (q.product as CardProduct) : 'debit';
  const range = bank.bins.find((b) => b.product === product) ?? bank.bins.find((b) => b.product === 'debit') ?? bank.bins[0]!;
  const scheme: CardScheme = range.scheme;
  const channel = q.channel === 'in_store' ? 'in_store' : 'online';
  const amount = Math.max(0, Math.round(Number((q.amount ?? '1000').replace(',', '.')) * 100) || 0);
  const label = (id: string) => pickText(acquirers.find((a) => a.id === id)?.label, locale) || id;
  const quotes = r.acquiring.filter((x) => x.channel === channel && acquirers.find((a) => a.id === x.acquirerId)?.rails.includes('card')).map((terms) => {
    const onUs = bank.acquirerIds.includes(terms.acquirerId);
    return { terms, onUs: onUs && terms.onUsBps !== null, ownBank: onUs, cost: acquiringCostOf(terms, { scheme, product, domestic: true, onUs }, amount) };
  }).sort((a, b) => a.cost.totalMinor - b.cost.totalMinor);
  const productWord: Record<CardProduct, [string, string]> = { debit: ['Debit', 'Дебетова'], credit: ['Credit', 'Кредитна'], premium: ['Premium', 'Преміальна'], commercial: ['Corporate', 'Корпоративна'], other: ['Other', 'Інша'] };

  // The PSP assembly's tariffs.
  const tariff = p.tariffs.find((x) => x.id === q.tariff) ?? p.tariffs[0]!;
  const instrument = (instrumentIds as readonly string[]).includes(q.instrument ?? '') ? (q.instrument as InstrumentId) : 'card';
  const pamount = Math.max(0, Math.round(Number((q.pamount ?? '1000').replace(',', '.')) * 100) || 0);
  const fee = feeFor(tariff, instrument, pamount);
  const users = (id: string) => p.contracts.filter((c) => c.tariffId === id).map((c) => pickText(p.units.find((u) => u.id === c.unitId)?.name, locale));

  return (
    <>
      <PageHead sheet={`${t('Sheet', 'Аркуш')} RP-09`} title={t('What a payment costs', 'Скільки коштує платіж')} lead={t('Where the banks settle to the company directly, the platform takes no share of payments. What a payment costs is the bank’s fee under the company’s own agreement: interchange, scheme fees and the acquirer’s markup, or a blended rate, or an on-us rate for the bank’s own cards. The calculator prices one payment at each acquirer of the demo group.', 'Там, де банки розраховуються з компанією напряму, платформа не бере частки від платежів. Вартість платежу — це комісія банку за власним договором компанії: interchange, збори платіжних систем і маржа еквайра, або єдина ставка, або ставка on-us для власних карток банку. Калькулятор оцінює один платіж у кожного еквайра демо-групи.')} />
      <Container className="space-y-14 py-14">
        <section className="chamfer p-6 sm:p-8 [--cut:18px] [--fill:var(--color-paper-deep)]">
          <h2 className="text-2xl font-semibold text-ink-900">{t('One payment, at each acquirer', 'Один платіж у кожного еквайра')}</h2>
          <form className="mt-5 flex flex-wrap items-end gap-3">
            <label className="text-[0.85rem] text-ink-700">{t('Card’s bank', 'Банк картки')}<select name="bank" defaultValue={bank.id} className={`mt-1 block ${field}`}>{home.map((i) => <option key={i.id} value={i.id}>{pickText(i.name, locale)}</option>)}</select></label>
            <label className="text-[0.85rem] text-ink-700">{t('Card', 'Картка')}<select name="product" defaultValue={product} className={`mt-1 block ${field}`}>{products.map((x) => <option key={x} value={x}>{t(productWord[x][0], productWord[x][1])}</option>)}</select></label>
            <label className="text-[0.85rem] text-ink-700">{t('Channel', 'Канал')}<select name="channel" defaultValue={channel} className={`mt-1 block ${field}`}><option value="online">{t('Online', 'Онлайн')}</option><option value="in_store">{t('At the till', 'На касі')}</option></select></label>
            <label className="text-[0.85rem] text-ink-700">{t('Amount', 'Сума')}, UAH<input name="amount" defaultValue={(amount / 100).toFixed(2)} inputMode="decimal" className={`mt-1 block w-32 font-mono ${field}`} /></label>
            <button type="submit" className={button}><Icon name="coins" className="size-4" />{t('Calculate', 'Розрахувати')}</button>
          </form>
          <p className="mt-4 text-[0.85rem] text-ink-500">{t('The card', 'Картка')}: {pickText(bank.name, locale)} · {scheme} · {t(productWord[product][0], productWord[product][1]).toLowerCase()} · {t('BIN range', 'діапазон BIN')} {range.prefix}…</p>
          <div className="mt-5 overflow-x-auto border border-graphite/20 bg-paper">
            <table className="w-full min-w-[640px] text-left text-[0.86rem]">
              <thead><tr className="border-b border-ink-900/80">{[t('Acquirer', 'Еквайр'), t('Agreement', 'Договір'), t('Interchange', 'Interchange'), t('Scheme fee', 'Збір системи'), t('Markup', 'Маржа'), t('Cost', 'Вартість'), t('Rate', 'Ставка')].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>{quotes.map(({ terms, onUs, ownBank, cost }) => (
                <tr key={terms.id} className={`border-b border-graphite/15 ${onUs ? 'bg-teal-100' : ''}`}>
                  <td className="px-3 py-2 text-ink-900">{label(terms.acquirerId)}{ownBank ? <span className="annot ml-2 text-[0.55rem] text-teal-600">{onUs ? 'on-us' : t('own bank, no on-us clause', 'власний банк, без умови on-us')}</span> : null}</td>
                  <td className="px-3 py-2">{pickText(acquiringModelLabels[cost.model], locale)}</td>
                  <td className="px-3 py-2 tabular-nums">{cost.interchangeMinor !== null ? money(cost.interchangeMinor, 'UAH', locale) : '—'}</td>
                  <td className="px-3 py-2 tabular-nums">{cost.schemeMinor !== null ? money(cost.schemeMinor, 'UAH', locale) : '—'}</td>
                  <td className="px-3 py-2 tabular-nums">{cost.markupMinor !== null ? money(cost.markupMinor, 'UAH', locale) : '—'}</td>
                  <td className="px-3 py-2 font-semibold tabular-nums text-ink-900">{money(cost.totalMinor, 'UAH', locale)}</td>
                  <td className="px-3 py-2 tabular-nums">{percent(amount ? Math.round((cost.totalMinor / amount) * 10_000) : 0, locale, 2)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <p className="mt-4 text-[0.85rem] text-ink-500">{t('Interchange and scheme fees are the demo’s assumptions under the 1.2 % cap on domestic consumer cards; real figures come from the schemes’ tables and the acquirer’s IC++ reports. Under a blended or on-us rate the parts are not shown separately. Integer arithmetic: each part is rounded half up in kopiykas.', 'Interchange і збори систем — припущення демо в межах обмеження 1,2 % для внутрішніх споживчих карток; справжні значення беруться з таблиць платіжних систем і звітів IC++ еквайра. За єдиної ставки чи ставки on-us частини окремо не показуються. Цілочисельна арифметика: кожна частина округлюється до копійки, половина — догори.')}</p>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-ink-900">{t('How the platform is paid for', 'Як оплачується платформа')}</h2>
            <p className="mt-3 text-ink-700">{t('In an assembly like the retail group’s, the platform is paid for as software — by the modules assembled and the volume of operations it processes — not as a percentage of payments. It does not hold the money, so there is no settlement delay, rolling reserve or payout fee to price. The banks are paid by the company under its own agreements, and the platform checks every settlement against them.', 'У збірці, як у роздрібної групи, платформа оплачується як програмне забезпечення — за зібрані модулі й обсяг операцій, які вона обробляє, — а не відсотком від платежів. Вона не тримає коштів, тож немає затримки розрахунку, ковзного резерву чи плати за виплати, які треба було б оцінювати. Банкам компанія платить за власними договорами, а платформа звіряє з ними кожен розрахунок.')}</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-ink-900">{t('What lowers the cost', 'Що знижує вартість')}</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink-700">
              <li>{t('Routing online card payments on-us where an agreement has an on-us rate, within an approval threshold.', 'Маршрутизація онлайн-платежів картками on-us там, де договір має ставку on-us, у межах порогу схвалення.')}</li>
              <li>{t('An on-us clause and IC++ in the agreements, argued with the banks’ own reports of whose cards the customers carry.', 'Умова on-us та IC++ у договорах — з аргументами зі звітів самих банків про те, чиї картки мають покупці.')}</li>
              <li>{t('Instant transfers and QR payments with a fixed fee where the payer chooses them.', 'Миттєві перекази й оплата QR з фіксованою платою там, де їх обирає платник.')}</li>
              <li>{t('Fees checked against the agreement every day, so an overcharge becomes a claim.', 'Щоденна перевірка комісій за договором, щоб переплата ставала претензією.')}</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-ink-900">{t('Tariffs of the PSP assembly', 'Тарифи PSP-збірки')}</h2>
          <p className="mt-3 max-w-3xl text-ink-700">{t('Where the platform is assembled as a payment service provider, it holds its merchants’ money and charges a fee per payment by tariff. The fee is part of the amount, never added on top: a share of the distribution like any other, visible to the merchant always and to the payer whenever the merchant chooses.', 'Там, де платформу зібрано як надавача платіжних послуг, вона тримає кошти мерчантів і стягує комісію за платіж за тарифом. Комісія — частина суми, ніколи не надбавка: така сама частка розподілу, як інші, яку мерчант бачить завжди, а платник — коли мерчант так вирішить.')}</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {p.tariffs.map((x) => (
              <article key={x.id} className="sketch bg-paper p-6">
                <p className="annot text-sunrise-600">{x.currency}</p>
                <h3 className="mt-1 text-xl font-semibold text-ink-900">{pickText(x.name, locale)}</h3>
                <ul className="mt-4 divide-y divide-graphite/15 text-[0.9rem]">
                  {Object.entries(x.rates).map(([id, rate]) => <li key={id} className="flex justify-between gap-3 py-1.5"><span>{pickText(findInstrument(id).label, locale)}</span><span className="tabular-nums text-ink-900">{percent(rate!.bps, locale, 2)}{rate!.fixedMinor ? ` + ${money(rate!.fixedMinor, x.currency, locale)}` : ''}</span></li>)}
                  {Object.keys(x.rates).length === 0 ? <li className="py-1.5 text-ink-900">{t('No fee on any instrument', 'Без комісії на всіх інструментах')}</li> : null}
                </ul>
                <p className="annot mt-4 text-[0.6rem] text-ink-500">{t('Dispute', 'Спір')} {money(x.disputeFeeMinor, x.currency, locale)} · {t('refund', 'повернення')} {money(x.refundFeeMinor, x.currency, locale)} · {t('monthly', 'щомісяця')} {money(x.monthlyMinor, x.currency, locale)}</p>
                <p className="mt-3 text-[0.82rem] text-ink-500">{t('Used by', 'Користуються')}: {users(x.id).join(', ') || '—'}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 border border-graphite/20 bg-paper-deep p-6">
            <h3 className="text-xl font-semibold text-ink-900">{t('The fee of one payment by tariff', 'Комісія одного платежу за тарифом')}</h3>
            <form className="mt-4 flex flex-wrap items-end gap-3">
              <label className="text-[0.85rem] text-ink-700">{t('Tariff', 'Тариф')}<select name="tariff" defaultValue={tariff.id} className={`mt-1 block ${field}`}>{p.tariffs.map((x) => <option key={x.id} value={x.id}>{pickText(x.name, locale)}</option>)}</select></label>
              <label className="text-[0.85rem] text-ink-700">{t('Instrument', 'Інструмент')}<select name="instrument" defaultValue={instrument} className={`mt-1 block ${field}`}>{instrumentIds.map((id) => <option key={id} value={id}>{pickText(findInstrument(id).label, locale)}</option>)}</select></label>
              <label className="text-[0.85rem] text-ink-700">{t('Amount', 'Сума')}, {tariff.currency}<input name="pamount" defaultValue={(pamount / 100).toFixed(2)} inputMode="decimal" className={`mt-1 block w-32 font-mono ${field}`} /></label>
              <button type="submit" className={button}><Icon name="coins" className="size-4" />{t('Calculate', 'Розрахувати')}</button>
            </form>
            <dl className="mt-5 grid max-w-xl grid-cols-3 gap-4">
              {[[t('The payer pays', 'Платник сплачує'), money(pamount, tariff.currency, locale)], [t('The fee', 'Комісія'), money(fee, tariff.currency, locale)], [t('The merchant’s shares', 'Частки мерчанта'), money(pamount - fee, tariff.currency, locale)]].map(([k, v]) => <div key={k} className="border-t-2 border-ink-900 pt-2"><dt className="annot text-[0.6rem] text-ink-500">{k}</dt><dd className="mt-1 text-lg font-semibold tabular-nums text-ink-900 sm:text-xl">{v}</dd></div>)}
            </dl>
          </div>
        </section>
      </Container>
    </>
  );
}
