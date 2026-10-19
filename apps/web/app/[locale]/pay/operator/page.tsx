import Link from 'next/link';
import { formatDate, formatNumber } from '@river/i18n';
import { providerLabels } from '@river/pay-facts';
import { findMerchant, getPayRuntime } from '@river/pay-runtime';
import { readAllOrders, type OrderView } from '@river/pay-views';
import { OrderLine } from '@/components/pay/OrderLine';
import { PayStatus } from '@/components/pay/PayStatus';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { attentionOf } from '@/lib/pay/attentionOf';
import { requireOperator } from '@/lib/pay/requireOperator';
import { resolveLocale } from '@/lib/resolveLocale';
import { payMoney } from '@/lib/pay/payMoney';

/** The river today: how many orders stand where, which need a steward's eye and why, and every order. */
export default async function OperatorOrders({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  await requireOperator(locale);
  const dict = getDictionary(locale);
  const t = dict.pay;
  const o = t.operator;
  const runtime = await getPayRuntime();
  const shown = 500;
  const orders = await readAllOrders(runtime.store, runtime.root, shown);
  const now = new Date().toISOString();
  const merchant = (id: string) => findMerchant(runtime.config, id)?.name ?? id;
  const flagged = orders.map((order) => ({ order, why: attentionOf(order, t, locale, now) })).filter((x): x is { order: OrderView; why: string } => x.why !== null);
  const count = (...statuses: string[]) => orders.filter((order) => statuses.includes(order.status)).length;
  const counts: Array<[number, string, boolean]> = [
    [count('placed', 'invoiced', 'retry'), o.counts.waiting, false], [count('routing', 'open', 'approved'), o.counts.underWay, false],
    [count('paid'), o.counts.paid, false], [flagged.length, o.counts.attention, flagged.length > 0], [count('cancelled'), o.counts.closed, false],
  ];
  return (
    <div className="space-y-14">
      <section>
        <h2 className="annot mb-4 text-ink-500">{o.today}</h2>
        <ol className="grid grid-cols-2 border-l border-t border-graphite/30 sm:grid-cols-5">
          {counts.map(([n, label, alert]) => (
            <li key={label} className="border-b border-r border-graphite/30 p-5">
              <b className={`font-display text-3xl font-semibold tabular-nums ${alert ? 'text-attention-500' : n > 0 ? 'text-ink-900' : 'text-ink-300'}`}>{formatNumber(n, locale)}</b>
              <span className="block text-sm text-ink-500">{label}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-5 text-2xl font-semibold">{o.attention}</h2>
        {flagged.length === 0 ? <p className="text-ink-500">{o.attentionNone}</p> : (
          <ul className="grid gap-px border-y border-attention-500/60 bg-attention-500/20">
            {flagged.map(({ order, why }) => (
              <li key={order.orderId} className="bg-paper">
                <Link href={href(locale, `/pay/operator/orders/${order.orderId}`)} className="grid gap-x-8 gap-y-2 py-4 hover:bg-paper-deep/60 md:grid-cols-[1.2fr_2fr_auto] md:items-center md:px-3">
                  <span><b className="text-ink-900">{order.title}</b><span className="annot block text-ink-500">{merchant(order.merchantId)} · {order.payerRef}</span></span>
                  <span className="text-[0.95rem] text-ink-700">{why}</span>
                  <span className="flex items-center gap-4 md:justify-end"><b className="tabular-nums text-ink-900">{payMoney(order.amountMinor, order.currency, locale)}</b><PayStatus status={order.status} t={t} /></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-5 text-2xl font-semibold">{o.all}</h2>
        {orders.length === shown ? <p className="annot mb-4 text-ink-500">{o.latest.replace('{n}', String(shown))}</p> : null}
        {orders.length === 0 ? <p className="text-ink-500">{o.none}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[60rem] border-t border-graphite/60 text-left text-[0.95rem]">
              <thead className="annot text-ink-500">
                <tr className="border-b border-graphite/30">
                  {[o.columns.order, o.columns.merchant, o.columns.payer].map((label) => <th key={label} scope="col" className="py-3 pr-4 font-normal">{label}</th>)}
                  {[o.columns.amount, o.columns.net].map((label) => <th key={label} scope="col" className="py-3 pr-4 text-right font-normal">{label}</th>)}
                  {[o.columns.provider, o.columns.status, o.columns.placed].map((label) => <th key={label} scope="col" className="py-3 pr-4 font-normal">{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderId} className="border-b border-graphite/20 align-top hover:bg-paper-deep/50">
                    <td className="py-3 pr-4"><Link className="font-semibold text-ink-900 underline decoration-graphite/30 underline-offset-4 hover:decoration-sunrise-500" href={href(locale, `/pay/operator/orders/${order.orderId}`)}>{order.title}</Link><span className="annot block text-[0.62rem] text-ink-500">{order.orderId}</span></td>
                    <td className="py-3 pr-4">{merchant(order.merchantId)}</td>
                    <td className="py-3 pr-4 font-mono text-sm">{order.payerRef}</td>
                    <td className="py-3 pr-4 text-right font-semibold tabular-nums text-ink-900">{payMoney(order.amountMinor, order.currency, locale)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{order.invoice ? payMoney(order.invoice.netMinor, order.currency, locale) : '—'}</td>
                    <td className="py-3 pr-4">{order.route ? providerLabels[order.route.provider] : '—'}{order.session?.simulated || order.paid?.simulated ? <span className="annot block text-[0.62rem] text-ink-500">{t.standIn}</span> : null}</td>
                    <td className="py-3 pr-4"><PayStatus status={order.status} t={t} /><span className="mt-2 block"><OrderLine status={order.status} t={t} mode="compact" /></span></td>
                    <td className="py-3 pr-4 whitespace-nowrap text-ink-500">{formatDate(order.placedAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
