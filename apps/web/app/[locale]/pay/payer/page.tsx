import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatDate } from '@river/i18n';
import { findMerchant, getPayRuntime } from '@river/pay-runtime';
import { readPayerOrders, type OrderView } from '@river/pay-views';
import { OrderLine } from '@/components/pay/OrderLine';
import { PayStatus } from '@/components/pay/PayStatus';
import { PageHead } from '@/components/site/PageHead';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { getPayActor } from '@/lib/pay/getPayActor';
import { resolveLocale } from '@/lib/resolveLocale';
import { payMoney } from '@/lib/pay/payMoney';

/**
 * The payer's cabinet: what is asked of them, what is under way, and the receipts of what they paid.
 * Everything here is also reachable without an account, by each invoice's own link.
 */
export default async function PayerCabinet({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const actor = await getPayActor(locale);
  if (!actor || actor.role !== 'payer') redirect(href(locale, '/pay'));
  const runtime = await getPayRuntime();
  const dict = getDictionary(locale);
  const t = dict.pay;
  const orders = await readPayerOrders(runtime.store, runtime.root, actor.ref);
  const now = new Date().toISOString();
  const expired = (o: OrderView) => o.invoice !== null && o.invoice.expiresAt <= now;
  const groups: Array<[string, OrderView[]]> = [
    [t.payer.toPay, orders.filter((o) => (o.status === 'invoiced' || o.status === 'retry') && !expired(o))],
    [t.payer.inProgress, orders.filter((o) => ['routing', 'open', 'approved'].includes(o.status))],
    [t.payer.receipts, orders.filter((o) => o.status === 'paid')],
    [t.payer.closed, orders.filter((o) => ['cancelled', 'refused', 'flagged', 'placed'].includes(o.status) || ((o.status === 'invoiced' || o.status === 'retry') && expired(o)))],
  ];
  return (
    <>
      <PageHead sheet={`${dict.common.sheet} 12`} title={actor.name} lead={<>{t.payer.title} · <span className="annot">{actor.ref}</span> · <Link className="underline decoration-graphite/40 underline-offset-4 hover:text-ink-900" href={href(locale, '/pay')}>{dict.nav.switch}</Link></>}>
        <p className="mt-4 max-w-2xl text-ink-500">{t.payer.lead}</p>
      </PageHead>
      <Container className="space-y-16 py-16">
        {orders.length === 0 ? <p className="text-ink-500">{t.payer.none}</p> : groups.filter(([, list]) => list.length > 0).map(([title, list]) => (
          <section key={title}>
            <h2 className="mb-6 text-2xl font-semibold">{title}</h2>
            <ul className="grid gap-px border-y border-graphite/60 bg-graphite/20">
              {list.map((o) => (
                <li key={o.orderId} className="bg-paper">
                  <Link href={href(locale, `/pay/payer/orders/${o.orderId}`)} className="group grid gap-x-8 gap-y-3 py-5 transition-colors hover:bg-paper-deep/60 md:grid-cols-[1.4fr_1fr_auto] md:items-center md:px-3">
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1"><b className="text-lg text-ink-900">{o.title}</b><PayStatus status={o.status} t={t} /></span>
                      <span className="annot mt-2 block text-ink-500">{t.payer.from.replace('{merchant}', findMerchant(runtime.config, o.merchantId)?.name ?? o.merchantId)} · {formatDate(o.status === 'paid' && o.paid ? o.paid.at : o.placedAt, locale)}</span>
                    </span>
                    <span><OrderLine status={o.status} t={t} mode="brief" /></span>
                    <span className="flex items-center gap-4 md:justify-end">
                      <b className="font-display text-xl font-semibold tabular-nums text-ink-900">{payMoney(o.amountMinor, o.currency, locale)}</b>
                      <Icon name="arrow" className="size-4 text-ink-500 transition group-hover:translate-x-1 group-hover:text-ink-900" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Container>
    </>
  );
}
