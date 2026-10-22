import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pickText } from '@river/i18n';
import { disputeReasonLabels, paymentStatusLabels, refundableMinor, refundReasonLabels, refundReasons, type DisputeLine } from '@river/psp-payment';
import { riverOfSession } from '@river/psp-runtime';
import { CabinetHead } from '@/components/cabinet/CabinetHead';
import { CostOfAcceptance } from '@/components/cabinet/routing/CostOfAcceptance';
import { FieldGrid } from '@/components/panels/FieldGrid';
import { Flash } from '@/components/panels/Flash';
import { Panel } from '@/components/panels/Panel';
import { Status } from '@/components/panels/Value';
import { BridgeTable } from '@/components/river/BridgeTable';
import { DeltaDrawing } from '@/components/river/DeltaDrawing';
import { captureAction, evidenceAction, refundAction, voidAction } from '@/lib/actions/cabinet';
import { cabinet } from '@/lib/cabinet';
import { instrumentCell } from '@/lib/columns';
import { day, money } from '@/lib/format';
import { resolveLocale } from '@/lib/resolveLocale';
import { acquirerName } from '@/lib/routing/acquirerName';
import { readQuery } from '@/lib/table';
import { paymentTone } from '@/lib/tones';

/** One payment: the money its session secured, the delta of shares, refunds, disputes and payouts — and the operator's actions on it. */
const disputeStatusWords: Record<DisputeLine['status'], [string, string]> = { open: ['open', 'відкрито'], evidenced: ['evidence submitted', 'докази подано'], won: ['won', 'виграно'], lost: ['lost', 'програно'] };

export default async function PaymentPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale: segment, id } = await params;
  const locale = resolveLocale(segment);
  const query = await readQuery(searchParams);
  const c = await cabinet(locale, null, 'flows.read');
  const { t } = c;
  const p = c.w.views.payments.get(id);
  if (!p || !c.visible.has(p.unitId)) notFound();
  const ctx = { locale, now: c.now, unitName: c.unitName, link: c.link };
  const river = riverOfSession(c.w, p.sessionId);
  const back = c.link(`/payments/${id}`);
  const refundable = refundableMinor(p);
  const hidden = (n: string, v: string) => <input type="hidden" name={n} value={v} />;
  const tone = (role: string) => (role === 'seller' ? 'seller' : role === 'charity' ? 'charity' : role === 'psp_fee' || role === 'acquirer_fee' ? 'fee' : role === 'reserve' ? 'reserve' : role === 'platform' ? 'platform' : 'merchant') as 'seller';
  const recipient = (id: string) => (id.startsWith('acq:') ? acquirerName(id, locale) : c.unitName(id));
  const priced = c.stand === 'retail' && p.rail === 'card';
  return (
    <>
      <CabinetHead kicker={`${t('Payment', 'Платіж')} · ${c.unitName(p.unitId)}`} title={<span className="font-mono text-[1.4rem]">{p.paymentId}</span>}
        lead={<span className="flex flex-wrap items-center gap-x-4"><span className="text-lg font-semibold tabular-nums text-ink-900">{money(p.capturedMinor || p.amountMinor, p.currency, locale)}</span><Status label={pickText(paymentStatusLabels[p.status], locale)} tone={paymentTone[p.status]} /></span>}
        actions={p.status === 'authorised' && c.may('payments.capture', p.unitId) ? (
          <div className="flex gap-2">
            <form action={captureAction}>{hidden('paymentId', id)}{hidden('back', back)}<button type="submit" className="chamfer px-3.5 py-2 text-[0.82rem] font-semibold text-ink-900 [--cut:6px] [--fill:var(--color-sunrise-500)]">{t('Capture', 'Списати')}</button></form>
            <form action={voidAction}>{hidden('paymentId', id)}{hidden('back', back)}<button type="submit" className="annot border border-graphite/40 px-3 py-2 text-ink-700">{t('Release', 'Зняти блокування')}</button></form>
          </div>
        ) : undefined} />
      <Flash query={query} locale={locale} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel title={t('The payment’s view', 'Проєкція платежу')}>
          <FieldGrid locale={locale} fields={[
            { label: t('Session', 'Сесія'), cell: { kind: 'mono', value: p.sessionId, href: c.link(`/sessions/${p.sessionId}`) } },
            { label: t('Invoice', 'Інвойс'), cell: { kind: 'mono', value: c.w.views.invoices.get(p.invoiceId)?.number ?? p.invoiceId, href: c.link(`/invoices/${p.invoiceId}`) } },
            { label: t('Order', 'Замовлення'), cell: { kind: 'mono', value: c.w.views.orders.get(p.orderId)?.reference ?? p.orderId, href: c.link(`/orders/${p.orderId}`) } },
            { label: t('Instrument', 'Інструмент'), cell: instrumentCell(ctx, p.instrument, p.detail) },
            { label: t('Rail · acquirer', 'Рейка · еквайр'), cell: { kind: 'text', value: `${p.rail} · ${acquirerName(p.acquirer, locale)}`, sub: p.authCode ? `auth ${p.authCode}` : p.via ?? undefined } },
            { label: t('Secured', 'Забезпечено'), cell: { kind: 'datetime', iso: p.createdAt } },
            { label: t('Captured', 'Списано'), cell: { kind: 'money', minor: p.capturedMinor, currency: p.currency } },
            { label: t('Captured at', 'Час списання'), cell: { kind: 'datetime', iso: p.capturedAt } },
            { label: c.w.feeRecipient === null ? t('Acquirer’s fee', 'Комісія еквайра') : t('PSP fee', 'Комісія PSP'), cell: { kind: 'money', minor: p.feeMinor, currency: p.currency, muted: true } },
            { label: t('Refunded', 'Повернено'), cell: { kind: 'money', minor: p.refundedMinor, currency: p.currency, muted: true } },
            { label: t('Charged back', 'Чарджбек'), cell: { kind: 'money', minor: p.chargebackMinor, currency: p.currency, muted: true } },
            { label: t('Refundable', 'Можна повернути'), cell: { kind: 'money', minor: refundable, currency: p.currency } },
          ]} />
          {refundable > 0 && c.may('payments.refund', p.unitId) ? (
            <form action={refundAction} className="mt-5 flex flex-wrap items-end gap-3 border-t border-graphite/20 pt-4">
              {hidden('paymentId', id)}{hidden('back', back)}
              <label className="text-[0.8rem] text-ink-700">{t('Amount', 'Сума')}<input name="amount" defaultValue={(refundable / 100).toFixed(2)} className="mt-1 block w-32 border border-graphite/30 bg-paper px-2 py-1.5 font-mono text-sm" /></label>
              <label className="min-w-[14rem] flex-1 text-[0.8rem] text-ink-700">{t('Reason', 'Причина')}<select name="reason" defaultValue="returned" className="mt-1 block w-full border border-graphite/30 bg-paper px-2 py-1.5 text-sm">{refundReasons.filter((r) => r !== 'other').map((r) => <option key={r} value={r}>{pickText(refundReasonLabels[r], locale)}</option>)}</select></label>
              <button type="submit" className="chamfer px-3.5 py-2 text-[0.82rem] font-semibold text-paper [--cut:6px] [--fill:var(--color-ink-900)]">{t('Refund', 'Повернути')}</button>
            </form>
          ) : null}
        </Panel>
        <div className="space-y-6">
          <Panel title={t('Distribution', 'Розподіл')}>
            {p.allocations.length === 0 ? <p className="text-ink-500">{t('Formed at the capture.', 'Формується при списанні.')}</p> : <DeltaDrawing total={[t('Captured', 'Списано'), money(p.capturedMinor, p.currency, locale)]} streams={p.allocations.map((a) => ({ label: recipient(a.recipientUnitId), role: `${a.role}${a.holdUntil ? ` · ${t('held until', 'до')} ${a.holdUntil.slice(0, 10)}` : ''}`, amount: money(a.amountMinor, a.currency, locale), share: a.amountMinor, tone: tone(a.role) }))} />}
          </Panel>
          {priced ? (
            <Panel title={t('Cost of acceptance', 'Собівартість приймання')} note={t('What the acquirer charged for this card under the group’s own terms with it.', 'Скільки еквайр узяв за цю картку за власними умовами групи з ним.')}>
              <CostOfAcceptance c={c} payment={p} locale={locale} />
            </Panel>
          ) : null}
          {p.disputes.length > 0 ? (
            <Panel title={t('Disputes', 'Спори')} tone={p.disputes.some((d) => d.status === 'open') ? 'attention' : 'plain'}>
              <ul className="space-y-3">{p.disputes.map((d) => (
                <li key={d.disputeId} className="flex flex-wrap items-center justify-between gap-3 text-[0.88rem]">
                  <span><span className="font-mono">{d.disputeId}</span> · {pickText(disputeReasonLabels[d.reason as keyof typeof disputeReasonLabels], locale) || d.reason} · {money(d.amountMinor, p.currency, locale)}<span className="annot block text-[0.58rem] text-ink-500">{t(...disputeStatusWords[d.status])} · {t('respond by', 'відповісти до')} {day(d.respondBy, locale)}</span></span>
                  {d.status === 'open' && c.may('disputes.respond', p.unitId) ? <form action={evidenceAction}>{hidden('paymentId', id)}{hidden('disputeId', d.disputeId)}{hidden('back', back)}<button type="submit" className="chamfer px-3 py-1.5 text-[0.8rem] font-semibold text-ink-900 [--cut:6px] [--fill:var(--color-sunrise-500)]">{t('Submit evidence', 'Подати докази')}</button></form> : null}
                </li>))}</ul>
            </Panel>
          ) : null}
          {p.payouts.length > 0 ? (
            <Panel title={t('Payouts', 'Виплати')}>
              <ul className="divide-y divide-graphite/15 text-[0.86rem]">{p.payouts.map((x) => <li key={`${x.batchId}${x.rule}`} className="flex justify-between gap-3 py-1.5"><span className="min-w-0 break-words">{recipient(x.recipientUnitId)} {x.batchId.startsWith('stl_') ? <Link href={c.link(`/settlements/${x.batchId}`)} className="break-all font-mono text-[0.7rem] text-river-700 underline decoration-river-200 underline-offset-2 hover:decoration-river-700">{x.batchId}</Link> : <span className="font-mono text-[0.7rem] text-ink-500">{x.batchId}</span>}</span><span className="tabular-nums">{money(x.amountMinor, p.currency, locale)}</span></li>)}</ul>
            </Panel>
          ) : null}
        </div>
      </div>
      {river ? <Panel title={t('Its own stream, after the mouth', 'Власний потік, після гирла')} className="mt-6" flush>{river.after.length ? <BridgeTable rows={river.after} locale={locale} currency={p.currency} /> : <p className="p-4 text-ink-500">{t('No refunds, disputes or payouts yet.', 'Ще немає повернень, спорів чи виплат.')}</p>}</Panel> : null}
    </>
  );
}
