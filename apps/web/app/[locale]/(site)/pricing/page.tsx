import type { Metadata } from 'next';
import { pickText } from '@river/i18n';
import { feeFor } from '@river/psp-contracts';
import { instrumentIds, type InstrumentId } from '@river/psp-facts';
import { findInstrument } from '@river/psp-instruments';
import { PageHead } from '@/components/site/PageHead';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { money, percent } from '@/lib/format';
import { lt } from '@/lib/lt';
import { resolveLocale } from '@/lib/resolveLocale';
import { world } from '@/lib/world';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { title: lt(resolveLocale((await params).locale))('Pricing', 'Тарифи') };
}

/**
 * Pricing, as the stand's own tariffs: what is charged per instrument and per event, stated before anyone
 * pays, taken from the amount (never added on top), and shown as a stream of the delta. A fee calculator
 * that works without scripts.
 */
export default async function Pricing({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ tariff?: string; instrument?: string; amount?: string }> }) {
  const locale = resolveLocale((await params).locale);
  const t = lt(locale);
  const q = await searchParams;
  const w = world();
  const tariff = w.tariffs.find((x) => x.id === q.tariff) ?? w.tariffs[0]!;
  const instrument = (instrumentIds as readonly string[]).includes(q.instrument ?? '') ? (q.instrument as InstrumentId) : 'card';
  const amount = Math.max(0, Math.round(Number((q.amount ?? '1000').replace(',', '.')) * 100) || 0);
  const fee = feeFor(tariff, instrument, amount);
  const users = (id: string) => w.contracts.filter((c) => c.tariffId === id).map((c) => pickText(w.units.find((u) => u.id === c.unitId)?.name, locale));
  const field = 'border border-graphite/30 bg-paper px-2 py-1.5 text-sm';
  return (
    <>
      <PageHead sheet={`${t('Sheet', 'Аркуш')} RP-09`} title={t('Honest fees, stated before anyone pays', 'Чесні комісії — названі до оплати')} lead={t('The fee is part of the amount, never added on top of it. It is a stream of the delta like any share, visible to the merchant always and to the payer whenever the merchant chooses. A charity pays nothing.', 'Комісія — частина суми, ніколи не надбавка до неї. Це такий самий протік дельти, як будь-яка частка: мерчант бачить її завжди, а платник — коли мерчант так вирішить. Благодійник не платить нічого.')} />
      <Container className="space-y-14 py-14">
        <section>
          <h2 className="text-2xl font-semibold text-ink-900">{t('The stand’s tariffs', 'Тарифи стенда')}</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {w.tariffs.map((x) => (
              <article key={x.id} className="sketch bg-paper p-6">
                <p className="annot text-sunrise-600">{x.currency}</p>
                <h3 className="mt-1 text-xl font-semibold text-ink-900">{pickText(x.name, locale)}</h3>
                <ul className="mt-4 divide-y divide-graphite/15 text-[0.9rem]">
                  {Object.entries(x.rates).map(([id, r]) => <li key={id} className="flex justify-between gap-3 py-1.5"><span>{pickText(findInstrument(id).label, locale)}</span><span className="tabular-nums text-ink-900">{percent(r!.bps, locale, 2)}{r!.fixedMinor ? ` + ${money(r!.fixedMinor, x.currency, locale)}` : ''}</span></li>)}
                  {Object.keys(x.rates).length === 0 ? <li className="py-1.5 text-ink-900">{t('No fee on any instrument', 'Без комісії на всіх інструментах')}</li> : null}
                </ul>
                <p className="annot mt-4 text-[0.6rem] text-ink-500">{t('Dispute', 'Спір')} {money(x.disputeFeeMinor, x.currency, locale)} · {t('refund', 'повернення')} {money(x.refundFeeMinor, x.currency, locale)} · {t('monthly', 'щомісяця')} {money(x.monthlyMinor, x.currency, locale)}</p>
                <p className="mt-3 text-[0.82rem] text-ink-500">{t('Used by', 'Користуються')}: {users(x.id).join(', ') || '—'}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="chamfer p-8 [--cut:18px] [--fill:var(--color-paper-deep)]">
          <h2 className="text-2xl font-semibold text-ink-900">{t('What one payment costs', 'Скільки коштує один платіж')}</h2>
          <form className="mt-5 flex flex-wrap items-end gap-3">
            <label className="text-[0.85rem] text-ink-700">{t('Tariff', 'Тариф')}<select name="tariff" defaultValue={tariff.id} className={`mt-1 block ${field}`}>{w.tariffs.map((x) => <option key={x.id} value={x.id}>{pickText(x.name, locale)}</option>)}</select></label>
            <label className="text-[0.85rem] text-ink-700">{t('Instrument', 'Інструмент')}<select name="instrument" defaultValue={instrument} className={`mt-1 block ${field}`}>{instrumentIds.map((id) => <option key={id} value={id}>{pickText(findInstrument(id).label, locale)}</option>)}</select></label>
            <label className="text-[0.85rem] text-ink-700">{t('Amount', 'Сума')}, {tariff.currency}<input name="amount" defaultValue={(amount / 100).toFixed(2)} inputMode="decimal" className={`mt-1 block w-36 font-mono ${field}`} /></label>
            <button type="submit" className="chamfer inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-paper [--cut:7px] [--fill:var(--color-ink-900)]"><Icon name="coins" className="size-4" />{t('Calculate', 'Розрахувати')}</button>
          </form>
          <dl className="mt-6 grid max-w-xl grid-cols-3 gap-4">
            {[[t('The payer pays', 'Платник сплачує'), money(amount, tariff.currency, locale)], [t('The fee', 'Комісія'), money(fee, tariff.currency, locale)], [t('The merchant’s streams', 'Протоки мерчанта'), money(amount - fee, tariff.currency, locale)]].map(([k, v]) => <div key={k} className="border-t-2 border-ink-900 pt-2"><dt className="annot text-[0.6rem] text-ink-500">{k}</dt><dd className="mt-1 text-xl font-semibold tabular-nums text-ink-900">{v}</dd></div>)}
          </dl>
          <p className="mt-4 text-[0.85rem] text-ink-500">{t('Integer arithmetic only: the rate is applied in hundredths of a per cent, rounded half up, plus the fixed part, never below the minimum and never above the amount.', 'Лише цілочисельна арифметика: ставка застосовується в сотих частках відсотка з округленням половини догори, плюс фіксована частина, не менше мінімуму й не більше суми.')}</p>
        </section>
      </Container>
    </>
  );
}
