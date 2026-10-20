import { notFound } from 'next/navigation';
import { pickText } from '@river/i18n';
import { fulfilmentLabels, orderStatusLabels } from '@river/psp-order';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { DataTable } from '@/components/panels/DataTable';
import { FactTimeline } from '@/components/panels/FactTimeline';
import { FieldGrid } from '@/components/panels/FieldGrid';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { Status } from '@/components/panels/Value';
import { DeltaDrawing } from '@/components/river/DeltaDrawing';
import { fulfilmentAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { invoiceColumns, paymentColumns, sessionColumns } from '@/lib/columns';
import { money } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { readQuery } from '@/lib/table';
import { orderTone } from '@/lib/tones';

/** One order: its lines and split plan, the net delta of its money, its invoices, attempts and payments, and every fact that formed it. */
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
  const tone = (role: string) => (role === 'seller' ? 'seller' : role === 'charity' ? 'charity' : role === 'psp_fee' ? 'fee' : role === 'reserve' ? 'reserve' : role === 'platform' ? 'platform' : 'merchant') as 'seller';
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
        <Panel title={t('Lines', 'Позиції')} note={t('Each line names its seller: the split plan gives every seller its own lines, less the commission.', 'Кожна позиція називає продавця: план розщеплення віддає кожному його позиції за вирахуванням комісії.')}>
          <ul className="divide-y divide-graphite/15 text-[0.9rem]">
            {o.lines.map((l) => <li key={l.sku} className="grid grid-cols-[1fr_auto] gap-3 py-2"><span><span className="text-ink-900">{pickText(l.title as never, locale)}</span><span className="annot block text-[0.58rem] text-ink-500">{l.sku} · {l.quantity} × {money(l.unitMinor, o.currency, locale)}{l.sellerUnitId ? ` · ${c.unitName(l.sellerUnitId)}` : ''}</span></span><span className="tabular-nums text-ink-900">{money(l.totalMinor, o.currency, locale)}</span></li>)}
          </ul>
          <div className="mt-4"><FieldGrid locale={locale} columns={2} fields={[
            { label: t('Split plan', 'План розщеплення'), cell: { kind: 'text', value: o.split.templateId ?? t('own rules', 'власні правила'), sub: `${o.split.rules.length} ${t('rules', 'правил')}` } },
            { label: t('Capture', 'Списання'), cell: { kind: 'text', value: o.captureMode === 'manual' ? t('manual, at shipment', 'ручне, при відвантаженні') : t('at once', 'одразу') } },
            { label: t('Payer', 'Платник'), cell: { kind: 'mono', value: o.payerRef } },
            { label: t('Channel', 'Канал'), cell: { kind: 'text', value: o.channel } },
            { label: t('Paid', 'Сплачено'), cell: { kind: 'money', minor: o.paidMinor, currency: o.currency } },
            { label: t('Refunded', 'Повернено'), cell: { kind: 'money', minor: o.refundedMinor + o.chargebackMinor, currency: o.currency, muted: true } },
            { label: t('Goods', 'Товар'), cell: { kind: 'status', label: pickText(fulfilmentLabels[o.fulfilment], locale), tone: o.fulfilment === 'delivered' ? 'success' : 'info' } },
            { label: t('Tracking', 'Відстеження'), cell: o.tracking ? { kind: 'text', value: o.tracking.carrier, sub: o.tracking.ref } : { kind: 'empty' } },
          ]} /></div>
        </Panel>
        <Panel title={t('The net delta', 'Чиста дельта')} note={t('What each stream keeps after refunds and lost disputes — the order’s projection of every split.', 'Що залишається кожному протоку після повернень і програних спорів — проєкція замовлення з кожного розщеплення.')}>
          {o.allocations.length === 0 ? <p className="text-ink-500">{t('Nothing captured yet: no streams.', 'Ще нічого не списано: протоків немає.')}</p> : (
            <DeltaDrawing total={[t('Paid', 'Сплачено'), money(o.paidMinor, o.currency, locale)]} streams={o.allocations.filter((a) => a.amountMinor > 0).map((a) => ({ label: c.unitName(a.recipientUnitId), role: a.role, amount: money(a.amountMinor, a.currency, locale), share: a.amountMinor, tone: tone(a.role) }))} />
          )}
        </Panel>
      </div>
      <Panel title={t('Invoices', 'Інвойси')} className="mt-6" flush><div className="px-1"><DataTable columns={invoiceColumns(ctx)} rows={invoices} locale={locale} query={{}} link={(i) => c.link(`/invoices/${i.invoiceId}`)} /></div></Panel>
      <Panel title={t('Attempts to pay', 'Спроби оплати')} className="mt-6" flush><div className="px-1"><DataTable columns={sessionColumns(ctx)} rows={sessions} locale={locale} query={{}} link={(s) => c.link(`/sessions/${s.sessionId}`)} /></div></Panel>
      <Panel title={t('Payments', 'Платежі')} className="mt-6" flush><div className="px-1"><DataTable columns={paymentColumns(ctx)} rows={payments} locale={locale} query={{}} link={(p) => c.link(`/payments/${p.paymentId}`)} /></div></Panel>
      <Panel title={t('Every fact that formed this order', 'Кожен факт, що сформував це замовлення')} className="mt-6"><FactTimeline entries={o.timeline} locale={locale} link={c.link} /></Panel>
    </>
  );
}
