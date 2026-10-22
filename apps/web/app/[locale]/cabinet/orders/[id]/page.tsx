import { notFound } from 'next/navigation';
import { pickText, pluralise } from '@river/i18n';
import { fulfilmentLabels, orderStatusLabels } from '@river/psp-order';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { pickingOf, type PickingFigures } from '@/components/cabinet/connections/pickingOf';
import { providerName } from '@/components/cabinet/connections/providerName';
import { DataTable } from '@/components/panels/DataTable';
import { FactTimeline } from '@/components/panels/FactTimeline';
import { FieldGrid } from '@/components/panels/FieldGrid';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { Status, Value } from '@/components/panels/Value';
import { DeltaDrawing } from '@/components/river/DeltaDrawing';
import { fulfilmentAction, reportPickingAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { invoiceColumns, paymentColumns, sessionColumns } from '@/lib/columns';
import { money } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery } from '@/lib/table';
import { orderTone } from '@/lib/tones';

/**
 * One order: its lines and split plan, the net delta of its money, what picking changed and how the money
 * followed it (when the order system reported a picking), its invoices, attempts and payments, and every
 * fact that formed it.
 */
export default async function OrderPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale: segment, id } = await params;
  const locale = resolveLocale(segment);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, null, 'flows.read');
  const { t } = c;
  const o = c.w.views.orders.get(id);
  if (!o || !c.visible.has(o.unitId)) notFound();
  const ctx = { locale, now: c.now, unitName: c.unitName, link: c.link };
  const invoices = o.invoiceIds.map((x) => c.w.views.invoices.get(x)).filter((x) => x !== undefined);
  const sessions = invoices.flatMap((i) => i.sessionIds).map((x) => c.w.views.sessions.get(x)).filter((x) => x !== undefined);
  const payments = o.paymentIds.map((x) => c.w.views.payments.get(x)).filter((x) => x !== undefined);
  const back = c.link(`/orders/${id}`);
  const nextStep = o.fulfilment === 'none' ? 'accepted' : o.fulfilment === 'accepted' ? 'shipped' : o.fulfilment === 'shipped' ? 'delivered' : null;
  const tone = (role: string) => (role === 'seller' ? 'seller' : role === 'charity' ? 'charity' : role === 'psp_fee' || role === 'acquirer_fee' ? 'fee' : role === 'reserve' ? 'reserve' : role === 'platform' ? 'platform' : 'merchant') as 'seller';
  const recipient = (id: string) => (id.startsWith('acq:') ? providerName(id.slice(4), locale, c.stand) : c.unitName(id));
  const retail = c.stand === 'retail';
  const templateWords: Record<string, [string, string]> = { direct: ['direct', 'напряму'], marketplace: ['marketplace', 'маркетплейс'], agency: ['agency', 'агентська схема'], franchise: ['franchise', 'франшиза'] };
  const picking = pickingOf(c.w, o);
  const changeWords: Record<'weight' | 'missing' | 'substitute', [string, string, 'info' | 'warning' | 'neutral']> = {
    weight: ['weighed goods', 'ваговий товар', 'info'], missing: ['missing', 'немає в наявності', 'warning'], substitute: ['substitute', 'заміна', 'neutral'],
  };
  const cur = o.currency;
  const m = (minor: number) => money(minor, cur, locale);
  // How the money met the picking, in one sentence.
  const courseOf = (f: PickingFigures): string => {
    if (f.course === 'paid_before') return t(`Paid in full before picking, so nothing was held. What was picked for less went back to the payer: ${m(f.refundedAfterPickingMinor)}.`, `Оплачено повністю до комплектації, тож нічого не блокувалося. Те, що зібрали на меншу суму, повернуто платнику: ${m(f.refundedAfterPickingMinor)}.`);
    if (f.course === 'paid_after') return t('Paid after picking, at the picked total, so no hold was needed.', 'Оплачено після комплектації, за зібраною сумою, тож блокування не знадобилося.');
    if (f.course === 'cancelled') return t('The order was cancelled before anyone paid: nothing was held or captured.', 'Замовлення скасовано до оплати: нічого не блокувалося й не списувалося.');
    if (f.course === 'unpaid') return t('Not paid yet: the invoice already asks for the picked total.', 'Ще не оплачено: інвойс уже виставлено на зібрану суму.');
    if (f.heldNowMinor > 0) return t(`The hold of ${m(f.heldNowMinor)} waits for the capture of the picked total.`, `Блокування ${m(f.heldNowMinor)} чекає на списання зібраної суми.`);
    if (f.capturedMinor === 0 && f.bonusMinor > 0) return t(`${m(f.holdMinor)} was held. The bonus points paid the whole picked total, so nothing was captured and the hold was released in full.`, `Було заблоковано ${m(f.holdMinor)}. Бонусні бали сплатили всю зібрану суму, тож нічого не списано, а блокування знято повністю.`);
    if (f.capturedMinor === 0) return t(`${m(f.holdMinor)} was held; nothing was captured, and the hold was released in full.`, `Було заблоковано ${m(f.holdMinor)}; нічого не списано, блокування знято повністю.`);
    if (f.bonusMinor > 0) return t(`${m(f.holdMinor)} was held. The capture took ${m(f.capturedMinor)} — the picked total less ${m(f.bonusMinor)} in bonus points — and released ${m(f.releasedMinor)}.`, `Було заблоковано ${m(f.holdMinor)}. Списано ${m(f.capturedMinor)} — зібрану суму за вирахуванням ${m(f.bonusMinor)}, сплачених бонусними балами, — і розблоковано ${m(f.releasedMinor)}.`);
    return t(`${m(f.holdMinor)} was held. The capture took the picked total, ${m(f.capturedMinor)}, and released ${m(f.releasedMinor)}.`, `Було заблоковано ${m(f.holdMinor)}. Списано зібрану суму, ${m(f.capturedMinor)}, і розблоковано ${m(f.releasedMinor)}.`);
  };
  return (
    <>
      <CabinetHead kicker={`${t('Order', 'Замовлення')} · ${c.unitName(o.unitId)}`} title={<span className="font-mono text-[1.4rem]">{o.reference}</span>}
        lead={<span className="flex flex-wrap items-center gap-x-4"><span className="text-lg font-semibold tabular-nums text-ink-900">{money(o.totalMinor, o.currency, locale)}</span><Status label={pickText(orderStatusLabels[o.status], locale)} tone={orderTone[o.status]} /><span className="font-mono text-[0.8rem] text-ink-500">{o.orderId}</span></span>}
        actions={nextStep && o.paidMinor > 0 && c.may('orders.write', o.unitId) ? (
          <form action={fulfilmentAction}><input type="hidden" name="orderId" value={id} /><input type="hidden" name="step" value={nextStep} /><input type="hidden" name="back" value={back} />
            <button type="submit" className="chamfer px-3.5 py-2 text-[0.82rem] font-semibold text-paper [--cut:6px] [--fill:var(--color-ink-900)]">{nextStep === 'accepted' ? t('Take into work', 'Прийняти в роботу') : nextStep === 'shipped' ? t('Mark shipped', 'Позначити відправленим') : t('Mark delivered', 'Позначити доставленим')}</button></form>
        ) : undefined} />
      <Flash query={query} locale={locale} />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title={t('Lines', 'Позиції')} note={retail && picking ? t('The basket as ordered; weighed goods at their estimated weight. What picking changed is below.', 'Кошик, як його замовили; ваговий товар — за орієнтовною вагою. Що змінила комплектація — нижче.') : retail ? t('The order as it was placed.', 'Замовлення, як його оформили.') : t('Each line names its seller: the split plan gives every seller its own lines, less the commission.', 'Кожна позиція називає продавця: план розщеплення віддає кожному його позиції за вирахуванням комісії.')}>
          <ul className="divide-y divide-graphite/15 text-[0.9rem]">
            {o.lines.map((l) => <li key={l.sku} className="grid grid-cols-[1fr_auto] gap-3 py-2"><span><span className="text-ink-900">{pickText(l.title as never, locale)}</span><span className="annot block text-[0.58rem] text-ink-500">{l.sku} · {l.quantity} × {money(l.unitMinor, o.currency, locale)}{l.sellerUnitId ? ` · ${c.unitName(l.sellerUnitId)}` : ''}</span></span><span className="tabular-nums text-ink-900">{money(l.totalMinor, o.currency, locale)}</span></li>)}
          </ul>
          <div className="mt-4"><FieldGrid locale={locale} columns={2} fields={[
            { label: t('Distribution plan', 'План розподілу'), cell: { kind: 'text', value: retail ? t('the unit’s net and the acquirer’s fee', 'сума для одиниці й комісія еквайра') : o.split.templateId ? (templateWords[o.split.templateId] ? t(templateWords[o.split.templateId]![0], templateWords[o.split.templateId]![1]) : o.split.templateId) : t('own rules', 'власні правила'), sub: pluralise(o.split.rules.length, locale, locale === 'uk' ? { one: '{n} правило', few: '{n} правила', many: '{n} правил', other: '{n} правила' } : { one: '{n} rule', other: '{n} rules' }) } },
            { label: t('Capture', 'Списання'), cell: { kind: 'text', value: o.captureMode === 'manual' ? (retail ? t('after picking', 'після комплектації') : t('manual, at shipment', 'ручне, при відвантаженні')) : t('at once', 'одразу') } },
            { label: t('Payer', 'Платник'), cell: { kind: 'mono', value: o.payerRef } },
            { label: t('Channel', 'Канал'), cell: { kind: 'text', value: o.channel } },
            { label: t('Paid', 'Сплачено'), cell: { kind: 'money', minor: o.paidMinor, currency: o.currency } },
            { label: t('Refunded', 'Повернено'), cell: { kind: 'money', minor: o.refundedMinor + o.chargebackMinor, currency: o.currency, muted: true } },
            { label: t('Goods', 'Товар'), cell: { kind: 'status', label: pickText(fulfilmentLabels[o.fulfilment], locale), tone: o.fulfilment === 'delivered' ? 'success' : 'info' } },
            { label: t('Tracking', 'Відстеження'), cell: o.tracking ? { kind: 'text', value: o.tracking.carrier, sub: o.tracking.ref } : { kind: 'empty' } },
          ]} /></div>
        </Panel>
        <Panel title={t('Distribution after refunds', 'Розподіл після повернень')} note={t('What each share keeps after refunds and lost disputes — the order’s view of every distribution of its payments.', 'Що залишається кожній частці після повернень і програних спорів — проєкція замовлення з кожного розподілу його платежів.')}>
          {o.allocations.length === 0 ? <p className="text-ink-500">{t('Nothing captured yet: no shares.', 'Ще нічого не списано: часток немає.')}</p> : (
            <DeltaDrawing total={[t('Paid', 'Сплачено'), money(o.paidMinor, o.currency, locale)]} streams={o.allocations.filter((a) => a.amountMinor > 0).map((a) => ({ label: recipient(a.recipientUnitId), role: a.role, amount: money(a.amountMinor, a.currency, locale), share: a.amountMinor, tone: tone(a.role) }))} />
          )}
        </Panel>
      </div>
      {picking ? (
        <Panel title={t('Picking and capture', 'Комплектація і списання')} className="mt-6"
          note={t('Capture after picking: an online order is held on the estimated basket. Once the order system reports the picking, the platform captures the picked total less the bonus points — a partial capture — and releases the rest of the hold.', 'Списання після комплектації: на онлайн-замовлення блокуються кошти на орієнтовну суму кошика. Коли система замовлень повідомляє про комплектацію, платформа списує зібрану суму за вирахуванням бонусних балів — це часткове списання — і розблоковує залишок блокування.')}>
          <FieldGrid locale={locale} columns={4} fields={[
            { label: t('Ordered', 'Замовлено'), cell: { kind: 'money', minor: picking.orderedMinor, currency: cur } },
            { label: t('Picked', 'Зібрано'), cell: { kind: 'money', minor: picking.pickedMinor, currency: cur } },
            { label: t('Difference', 'Різниця'), cell: { kind: 'money', minor: picking.pickedMinor - picking.orderedMinor, currency: cur, signed: true } },
            { label: t('Picked at', 'Час комплектації'), cell: { kind: 'datetime', iso: picking.pickedAt } },
            ...picking.invoices.map((i) => ({ label: `${t('Invoice', 'Інвойс')} ${i.number}`, cell: i.originalMinor !== null && i.originalMinor !== i.amountMinor
              ? { kind: 'text' as const, value: `${m(i.originalMinor)} → ${m(i.amountMinor)}`, sub: t('first claimed → adjusted to the picking', 'спершу виставлено → скориговано за комплектацією') }
              : { kind: 'text' as const, value: m(i.amountMinor), sub: t('not adjusted', 'без коригування') } })),
            { label: t('Hold', 'Блокування коштів'), cell: picking.holdMinor > 0 ? { kind: 'money', minor: picking.holdMinor, currency: cur } : { kind: 'text', value: t('none', 'немає'), sub: picking.course === 'paid_before' ? t('paid before picking', 'оплачено до комплектації') : picking.course === 'paid_after' ? t('paid after picking', 'оплачено після комплектації') : picking.course === 'cancelled' ? t('cancelled before payment', 'скасовано до оплати') : t('not paid yet', 'ще не оплачено') } },
            { label: t('Captured', 'Списано'), cell: { kind: 'money', minor: picking.capturedMinor, currency: cur } },
            { label: t('Released', 'Розблоковано'), cell: picking.holdMinor > 0 ? { kind: 'money', minor: picking.releasedMinor, currency: cur, muted: true } : { kind: 'empty' } },
            { label: t('Paid with bonus points', 'Сплачено бонусними балами'), cell: picking.bonusMinor > 0 ? { kind: 'money', minor: picking.bonusMinor, currency: cur } : { kind: 'empty' } },
            ...(picking.bonusReturnedMinor > 0 ? [{ label: t('Points returned', 'Повернено балів'), cell: { kind: 'money' as const, minor: picking.bonusReturnedMinor, currency: cur, muted: true } }] : []),
            ...(picking.refundedAfterPickingMinor > 0 ? [{ label: t('Refunded after picking', 'Повернено після комплектації'), cell: { kind: 'money' as const, minor: picking.refundedAfterPickingMinor, currency: cur } }] : []),
            ...(picking.heldNowMinor > 0 ? [{ label: t('Still held', 'Ще заблоковано'), cell: { kind: 'money' as const, minor: picking.heldNowMinor, currency: cur } }] : []),
          ]} />
          <p className="mt-4 border-l-2 border-graphite/40 pl-3 text-[0.88rem] text-ink-700">{courseOf(picking)}</p>
          {picking.changes.length === 0 ? <p className="mt-4 text-[0.88rem] text-ink-500">{t('Picked as ordered: nothing changed.', 'Зібрано, як замовлено: нічого не змінилося.')}</p> : (
            <>
              <p className="annot mt-4 text-[0.6rem] text-ink-500">{t('What picking changed', 'Що змінила комплектація')}</p>
              {picking.changesDerived ? <p className="mt-1 text-[0.8rem] text-ink-500">{t('The order system sent the picked lines without naming what changed; the differences below are read from the lines.', 'Система замовлень надіслала зібрані позиції, не назвавши змін; різниці нижче прочитано з позицій.')}</p> : null}
              <ul className="mt-1 divide-y divide-graphite/15 text-[0.9rem]">
                {picking.changes.map((ch) => {
                  const words = changeWords[ch.kind];
                  return (
                    <li key={`${ch.sku}${ch.kind}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 py-2">
                      <span className="min-w-0"><span className="text-ink-900">{pickText(ch.title as never, locale) || ch.sku}</span><span className="annot block text-[0.58rem] text-ink-500">{ch.sku}</span></span>
                      <span className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1"><Status label={t(words[0], words[1])} tone={words[2]} /><Value cell={{ kind: 'money', minor: ch.deltaMinor, currency: cur, signed: true }} locale={locale} /></span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Panel>
      ) : retail && o.status !== 'cancelled' && o.status !== 'refunded' && (o.unitId === 'rt-door' || (['rt-web', 'rt-app'].includes(o.unitId) && (payments.some((p) => p.status === 'authorised') || o.status === 'paid'))) ? (
        <Panel title={t('Waiting for picking', 'Чекає на комплектацію')} className="mt-6"
          note={t('The order system reports the picking through the API: the lines as picked, weighed goods at their weight. The platform then adjusts the invoice, captures the picked total less any bonus points, and releases the rest of the hold.', 'Система замовлень повідомляє про комплектацію через API: позиції, як їх зібрано, ваговий товар — за вагою. Далі платформа коригує інвойс, списує зібрану суму за вирахуванням бонусних балів і розблоковує залишок блокування.')}>
          <p className="text-[0.95rem] text-ink-700">{payments.some((p) => p.status === 'authorised')
            ? t(`${money(payments.filter((p) => p.status === 'authorised').reduce((s, p) => s + p.amountMinor, 0), cur, locale)} is held on the payer’s card for the estimated basket of ${m(o.totalMinor)}.`, `На картці платника заблоковано ${money(payments.filter((p) => p.status === 'authorised').reduce((s, p) => s + p.amountMinor, 0), cur, locale)} на орієнтовний кошик ${m(o.totalMinor)}.`)
            : t(`The estimated basket is ${m(o.totalMinor)}; nothing is held on it.`, `Орієнтовний кошик — ${m(o.totalMinor)}; блокування немає.`)}</p>
          {c.may('orders.write', o.unitId) ? (
            <form action={reportPickingAction} className="mt-4 flex flex-wrap items-center gap-3">
              <input type="hidden" name="orderId" value={id} /><input type="hidden" name="back" value={back} />
              <button type="submit" className="chamfer inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-paper [--cut:7px] [--fill:var(--color-ink-900)]">{t('Report picking, as the order system would', 'Повідомити про комплектацію, як це зробила б система замовлень')}</button>
              <span className="annot text-[0.58rem] text-ink-500">{t('Demo: weighed goods at 93–100 % of the estimate', 'Демо: ваговий товар — 93–100 % від орієнтовної ваги')}</span>
            </form>
          ) : null}
        </Panel>
      ) : null}
      <Panel title={t('Invoices', 'Інвойси')} className="mt-6" flush><div className="px-1"><DataTable columns={invoiceColumns(ctx)} rows={invoices} locale={locale} query={{}} link={(i) => c.link(`/invoices/${i.invoiceId}`)} /></div></Panel>
      <Panel title={t('Attempts to pay', 'Спроби оплати')} className="mt-6" flush><div className="px-1"><DataTable columns={sessionColumns(ctx)} rows={sessions} locale={locale} query={{}} link={(s) => c.link(`/sessions/${s.sessionId}`)} /></div></Panel>
      <Panel title={t('Payments', 'Платежі')} className="mt-6" flush><div className="px-1"><DataTable columns={paymentColumns(ctx)} rows={payments} locale={locale} query={{}} link={(p) => c.link(`/payments/${p.paymentId}`)} /></div></Panel>
      <Panel title={t('Every fact that formed this order', 'Кожен факт, що сформував це замовлення')} className="mt-6"><FactTimeline entries={o.timeline} locale={locale} link={c.link} /></Panel>
    </>
  );
}
