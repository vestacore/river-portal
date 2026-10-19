import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { formatDate, segmentForLocale } from '@river/i18n';
import { providerLabels } from '@river/pay-facts';
import { getPayRuntime, isOrderId, readRiver } from '@river/pay-runtime';
import { readOrder } from '@river/pay-views';
import { MoneySplit } from '@/components/pay/MoneySplit';
import { OrderLine } from '@/components/pay/OrderLine';
import { PayStatus } from '@/components/pay/PayStatus';
import { SubmitButton } from '@/components/pay/SubmitButton';
import { FactTable } from '@/components/site/FactTable';
import { Container } from '@/components/ui/Container';
import { inputClass } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { Timeline } from '@/components/ui/Timeline';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { withdrawOrderAction } from '@/lib/pay/actions';
import { getPayActor } from '@/lib/pay/getPayActor';
import { nextStep } from '@/lib/pay/nextStep';
import { resolveLocale } from '@/lib/resolveLocale';
import { payMoney } from '@/lib/pay/payMoney';

/** One order as its merchant sees it: where it stands, how the money divides, and everything that happened, in words. */
export default async function MerchantOrder({ params, searchParams }: { params: Promise<{ locale: string; orderId: string }>; searchParams: Promise<{ withdraw?: string }> }) {
  const { locale: segment, orderId } = await params;
  const refused = (await searchParams).withdraw === 'refused';
  const locale = resolveLocale(segment);
  const actor = await getPayActor(locale);
  if (!actor || actor.role !== 'merchant') redirect(href(locale, '/pay'));
  const runtime = await getPayRuntime();
  const order = isOrderId(orderId) ? await readOrder(runtime.store, runtime.root, orderId) : null;
  if (!order || order.merchantId !== actor.ref) notFound();
  const dict = getDictionary(locale);
  const t = dict.pay;
  const m = t.merchant;
  const river = await readRiver(runtime, order.orderId);
  const steps = river.map((row) => ({ label: (t.facts as Record<string, string>)[row.type] ?? row.type, when: formatDate(row.at, locale, true), done: true }));
  const open = order.status !== 'paid' && order.status !== 'flagged' && order.status !== 'cancelled';

  return (
    <Container className="py-12">
      <p className="mb-6"><Link className="annot inline-flex items-center gap-2 text-ink-700 underline decoration-graphite/40 underline-offset-4 hover:text-ink-900" href={href(locale, '/pay/merchant')}>← {m.back}</Link></p>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">{order.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-700">{nextStep(order, t, locale)}</p>
        </div>
        <PayStatus status={order.status} t={t} />
      </header>
      {refused && open ? <p className="chamfer mb-8 flex items-start gap-3 p-5 text-ink-900 [--cut:14px] [--fill:var(--color-attention-100)]" role="status"><Icon name="shield" className="mt-0.5 size-5 shrink-0 text-attention-500" />{m.withdrawRefused}</p> : null}
      <div className="mb-12"><OrderLine status={order.status} t={t} /></div>

      <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
        <section className="space-y-8">
          {order.invoice ? (
            <MoneySplit amountMinor={order.amountMinor} feeMinor={order.invoice.feeMinor} netMinor={order.invoice.netMinor} feeBps={order.invoice.feeBps} currency={order.currency} locale={locale}
              labels={{ total: m.payerPays, net: m.youReceive, fee: t.money.riverKeeps, rate: t.money.rate }} />
          ) : null}
          <FactTable rows={[
            [t.operator.facts.payer, <span key="p" className="font-mono text-sm">{order.payerRef}</span>],
            [m.placed, formatDate(order.placedAt, locale, true)],
            [m.validUntil, order.invoice ? formatDate(order.invoice.expiresAt, locale, true) : null],
            [m.route, order.route ? <>{providerLabels[order.route.provider]} <span className="text-ink-500">— {order.route.reason}</span></> : null],
            [t.invoice.receipt, order.receiptId ? <span key="r" className="font-mono text-sm">{order.receiptId}</span> : null],
            [t.invoice.reference, order.paid ? <span key="x" className="break-all font-mono text-sm">{order.paid.providerRef}</span> : null],
          ]} />
          {order.paid?.simulated ? <p className="annot text-attention-500">{t.invoice.simulated}</p> : null}
          {open ? (
            <form action={withdrawOrderAction} className="space-y-3 border-t border-graphite/25 pt-6">
              <input type="hidden" name="orderId" value={order.orderId} />
              <input type="hidden" name="localeSegment" value={segmentForLocale(locale)} />
              <label htmlFor="reason" className="block text-sm font-semibold text-ink-900">{m.withdrawReason}</label>
              <div className="flex flex-wrap gap-3">
                <input id="reason" name="reason" maxLength={200} className={`${inputClass} max-w-md py-2`} />
                <SubmitButton variant="outline" size="sm"><Icon name="close" className="size-4" />{m.withdraw}</SubmitButton>
              </div>
            </form>
          ) : null}
        </section>
        <section>
          <h2 className="annot mb-6 flex items-center gap-3 text-ink-500"><span className="h-px w-8 bg-graphite/40" aria-hidden="true" />{m.happened}</h2>
          <Timeline steps={steps} />
        </section>
      </div>
    </Container>
  );
}
