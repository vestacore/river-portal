import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatDate, formatNumber, pickText, segmentForLocale } from '@river/i18n';
import { currencies, providerLabels, providerNames } from '@river/pay-facts';
import { demoPayers, findMerchant, getPayRuntime } from '@river/pay-runtime';
import { readMerchantOrders, type OrderView } from '@river/pay-views';
import { OrderLine } from '@/components/pay/OrderLine';
import { PayStatus } from '@/components/pay/PayStatus';
import { PageHead } from '@/components/site/PageHead';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { getDictionary } from '@/lib/dictionary/getDictionary';
import { href } from '@/lib/href';
import { getPayActor } from '@/lib/pay/getPayActor';
import { nextStep } from '@/lib/pay/nextStep';
import { resolveLocale } from '@/lib/resolveLocale';
import { OrderForm } from './OrderForm';
import { payMoney } from '@/lib/pay/payMoney';

/**
 * The merchant's cabinet: ask for a payment, hand the link over, and see where every order stands
 * on the river — in words that say what happens next — and what is owed after the commission.
 */
export default async function MerchantCabinet({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const actor = await getPayActor(locale);
  if (!actor || actor.role !== 'merchant') redirect(href(locale, '/pay'));
  const runtime = await getPayRuntime();
  const merchant = findMerchant(runtime.config, actor.ref);
  if (!merchant) redirect(href(locale, '/pay'));
  const dict = getDictionary(locale);
  const t = dict.pay;
  const m = t.merchant;
  const orders = await readMerchantOrders(runtime.store, runtime.root, merchant.id);

  const sum = (pick: (o: OrderView) => number | null) => {
    const by = new Map<string, number>();
    for (const o of orders) { const minor = pick(o); if (minor !== null) by.set(o.currency, (by.get(o.currency) ?? 0) + minor); }
    return [...by.entries()].sort(([a], [b]) => a.localeCompare(b));
  };
  const owed = sum((o) => (o.status === 'paid' && o.invoice ? o.invoice.netMinor : null));
  const waiting = sum((o) => (['invoiced', 'routing', 'open', 'approved', 'retry'].includes(o.status) && o.invoice ? o.invoice.netMinor : null));

  return (
    <>
      <PageHead sheet={`${dict.common.sheet} 11`} title={merchant.name} lead={<>{m.title} · <Link className="underline decoration-graphite/40 underline-offset-4 hover:text-ink-900" href={href(locale, '/pay')}>{dict.nav.switch}</Link></>}>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          {providerNames.map((p) => (
            <li key={p} className={`annot flex items-center gap-2 ${merchant.providers.includes(p) ? 'text-ink-900' : 'text-ink-300'}`}>
              <span className={`size-1.5 ${merchant.providers.includes(p) ? 'bg-teal-500' : 'bg-ink-300'}`} aria-hidden="true" />{providerLabels[p]} — {merchant.providers.includes(p) ? m.connected : m.notConnected}
            </li>
          ))}
        </ul>
      </PageHead>
      <Container className="space-y-20 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="sketch bg-paper p-6 sm:p-8">
            <h2 className="mb-6 text-2xl font-semibold">{m.newOrder}</h2>
            <OrderForm t={m} currencies={currencies} payers={demoPayers.map((p) => ({ ref: p.ref, name: pickText(p.name, locale) }))} feePct={formatNumber(runtime.config.feeBps / 100, locale)} localeSegment={segmentForLocale(locale)} />
          </section>
          <section className="space-y-10">
            <div>
              <h2 className="annot mb-3 flex items-center gap-3 text-ink-500"><span className="h-px w-8 bg-graphite/40" aria-hidden="true" />{m.owed}</h2>
              {owed.length === 0 ? <p className="text-ink-500">{m.owedNone}</p> : (
                <ul className="space-y-1">{owed.map(([currency, minor]) => <li key={currency} className="font-display text-4xl font-semibold tabular-nums text-ink-900">{payMoney(minor, currency, locale)}</li>)}</ul>
              )}
              <p className="mt-3 text-sm text-ink-500">{m.owedHint}</p>
            </div>
            {waiting.length > 0 ? (
              <div>
                <h2 className="annot mb-3 flex items-center gap-3 text-ink-500"><span className="h-px w-8 bg-graphite/40" aria-hidden="true" />{m.waiting}</h2>
                <ul className="space-y-1">{waiting.map(([currency, minor]) => <li key={currency} className="font-display text-2xl font-semibold tabular-nums text-ink-500">{payMoney(minor, currency, locale)}</li>)}</ul>
              </div>
            ) : null}
          </section>
        </div>

        <section>
          <h2 className="mb-8 text-3xl font-semibold">{m.orders}</h2>
          {orders.length === 0 ? <p className="text-ink-500">{m.none}</p> : (
            <ul className="grid gap-px border-y border-graphite/60 bg-graphite/20">
              {orders.map((o) => (
                <li key={o.orderId} className="bg-paper">
                  <Link href={href(locale, `/pay/merchant/orders/${o.orderId}`)} className="group grid gap-x-8 gap-y-3 py-5 transition-colors hover:bg-paper-deep/60 md:grid-cols-[1.4fr_1fr_auto] md:items-center md:px-3">
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1"><b className="text-lg text-ink-900">{o.title}</b><PayStatus status={o.status} t={t} /></span>
                      <span className="mt-1 block text-[0.95rem] text-ink-700">{nextStep(o, t, locale)}</span>
                      <span className="annot mt-2 block text-ink-500">{o.payerRef} · {formatDate(o.placedAt, locale)}</span>
                    </span>
                    <span><OrderLine status={o.status} t={t} mode="brief" /></span>
                    <span className="flex items-center gap-4 md:justify-end">
                      <span className="text-right">
                        <b className="block font-display text-xl font-semibold tabular-nums text-ink-900">{payMoney(o.amountMinor, o.currency, locale)}</b>
                        {o.invoice ? <span className="annot block text-ink-500">→ {payMoney(o.invoice.netMinor, o.currency, locale)}</span> : null}
                      </span>
                      <Icon name="arrow" className="size-4 text-ink-500 transition group-hover:translate-x-1 group-hover:text-ink-900" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Container>
    </>
  );
}
