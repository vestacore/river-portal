import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDate, segmentForLocale } from '@river/i18n';
import { providerLabels } from '@river/pay-facts';
import { checkOrder, findMerchant, getPayRuntime, isOrderId, readRiver } from '@river/pay-runtime';
import { readOrder } from '@river/pay-views';
import { MoneySplit } from '@/components/pay/MoneySplit';
import { OrderLine } from '@/components/pay/OrderLine';
import { PayStatus } from '@/components/pay/PayStatus';
import { RiverRows } from '@/components/pay/RiverRows';
import { SubmitButton } from '@/components/pay/SubmitButton';
import { FactTable } from '@/components/site/FactTable';
import { inputClass } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { withdrawOrderAction } from '@/lib/pay/actions';
import { attentionOf } from '@/lib/pay/attentionOf';
import { requireOperator } from '@/lib/pay/requireOperator';
import { resolveLocale } from '@/lib/resolveLocale';
import { payMoney } from '@/lib/pay/payMoney';

/**
 * One order for a steward: the view the cabinets show, the whole stream it is read from, and the
 * replay check that the two agree. Here the river can be audited fact by fact.
 */
export default async function OperatorOrder({ params, searchParams }: { params: Promise<{ locale: string; orderId: string }>; searchParams: Promise<{ withdraw?: string }> }) {
  const { locale: segment, orderId } = await params;
  const refused = (await searchParams).withdraw === 'refused';
  const locale = resolveLocale(segment);
  const operator = await requireOperator(locale);
  const runtime = await getPayRuntime();
  const order = isOrderId(orderId) ? await readOrder(runtime.store, runtime.root, orderId) : null;
  if (!order) notFound();
  const dict = getDictionary(locale);
  const t = dict.pay;
  const o = t.operator;
  const [rows, check] = await Promise.all([readRiver(runtime, order.orderId), checkOrder(runtime, order.orderId)]);
  const agrees = check !== null && check.view && check.state && check.outbox;
  const why = attentionOf(order, t, locale, new Date().toISOString());
  const open = order.status !== 'paid' && order.status !== 'flagged' && order.status !== 'cancelled';
  const mono = (value: string) => <span className="break-all font-mono text-sm">{value}</span>;

  return (
    <div>
      <p className="mb-6"><Link className="annot inline-flex items-center gap-2 text-ink-700 underline decoration-graphite/40 underline-offset-4 hover:text-ink-900" href={href(locale, '/pay/operator')}>← {o.back}</Link></p>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold">{order.title}</h2>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-ink-900">{payMoney(order.amountMinor, order.currency, locale)}</p>
        </div>
        <PayStatus status={order.status} t={t} />
      </header>
      {why ? <p className="chamfer mb-8 flex items-start gap-3 p-5 text-ink-900 [--cut:14px] [--fill:var(--color-attention-100)]"><Icon name="shield" className="mt-0.5 size-5 shrink-0 text-attention-500" />{why}</p> : null}
      {refused && open ? <p className="chamfer mb-8 flex items-start gap-3 p-5 text-ink-900 [--cut:14px] [--fill:var(--color-attention-100)]" role="status"><Icon name="shield" className="mt-0.5 size-5 shrink-0 text-attention-500" />{t.merchant.withdrawRefused}</p> : null}
      <div className="mb-12"><OrderLine status={order.status} t={t} /></div>

      <div className="grid gap-12 lg:grid-cols-2">
        <FactTable rows={[
          [o.facts.order, mono(order.orderId)],
          [o.facts.invoice, order.invoice ? mono(order.invoice.invoiceId) : null],
          [o.facts.merchant, <>{findMerchant(runtime.config, order.merchantId)?.name ?? '—'} <span className="annot text-ink-500">{order.merchantId}</span></>],
          [o.facts.payer, mono(order.payerRef)],
          [o.facts.expires, order.invoice ? formatDate(order.invoice.expiresAt, locale, true) : null],
          [o.facts.route, order.route ? <>{providerLabels[order.route.provider]} <span className="text-ink-500">— {order.route.reason}</span></> : null],
          [o.facts.attempts, order.attempts.attempt > 0 ? String(order.attempts.attempt) : null],
          [o.facts.session, order.session ? <>{mono(order.session.sessionRef)}{order.session.simulated ? <span className="annot ml-2 text-ink-500">{t.standIn}</span> : null}</> : null],
          [o.facts.failure, order.lastFailure ? `${order.lastFailure.provider ? `${providerLabels[order.lastFailure.provider]}: ` : ''}${order.lastFailure.reason}` : null],
          [o.facts.receipt, order.receiptId ? mono(order.receiptId) : null],
          [t.invoice.reference, order.paid ? mono(order.paid.providerRef) : null],
        ]} />
        <div className="space-y-8">
          {order.invoice ? (
            <MoneySplit amountMinor={order.amountMinor} feeMinor={order.invoice.feeMinor} netMinor={order.invoice.netMinor} feeBps={order.invoice.feeBps} currency={order.currency} locale={locale}
              labels={{ total: t.money.amount, net: t.money.net, fee: t.money.fee, rate: t.money.rate }} />
          ) : null}
          <div className={`chamfer p-5 [--cut:14px] ${agrees ? '[--fill:var(--color-teal-100)]' : '[--fill:var(--color-attention-100)]'}`}>
            <p className="annot flex items-center gap-2 text-ink-700"><Icon name={agrees ? 'check' : 'close'} className={`size-4 ${agrees ? 'text-teal-600' : 'text-attention-500'}`} />{o.replay}</p>
            <p className="mt-2 text-ink-900">{agrees ? o.replayOk.replace('{n}', String(check.facts)) : o.replayBad}</p>
          </div>
          {operator.canAct && open ? (
            <form action={withdrawOrderAction} className="space-y-3 border-t border-graphite/25 pt-6">
              <input type="hidden" name="orderId" value={order.orderId} />
              <input type="hidden" name="as" value="operator" />
              <input type="hidden" name="localeSegment" value={segmentForLocale(locale)} />
              <label htmlFor="reason" className="block text-sm font-semibold text-ink-900">{o.withdraw}</label>
              <p className="text-sm text-ink-500">{o.withdrawNote}</p>
              <div className="flex flex-wrap gap-3">
                <input id="reason" name="reason" maxLength={200} placeholder={o.reason} className={`${inputClass} max-w-md py-2`} />
                <SubmitButton variant="outline" size="sm"><Icon name="close" className="size-4" />{t.merchant.withdraw}</SubmitButton>
              </div>
            </form>
          ) : null}
        </div>
      </div>

      <section className="mt-16">
        <h3 className="text-2xl font-semibold">{o.river}</h3>
        <p className="mb-8 mt-2 max-w-3xl text-ink-500">{o.riverLead}</p>
        <RiverRows rows={rows} t={t} locale={locale} />
      </section>
    </div>
  );
}
